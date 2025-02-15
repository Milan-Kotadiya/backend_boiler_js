require("dotenv").config();
const { default: mongoose } = require("mongoose");
const { authTypes, EventCases } = require("../constants/event.handler");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const {
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} = require("../config/dotenv.config");
const Emitter = require("../connections/event-emitter.connection");

const generateToken = async ({
  userId,
  expiresIn,
  secret = JWT_SECRET,
  aud,
  others = {},
}) => {
  const payload = {
    userId: userId,
    aud,
    ...others,
  };
  return jwt.sign(payload, secret, { expiresIn });
};

const register = async (data, socket) => {
  const { name, email, password } = data;

  const isExisted = await User.findOne({ email });

  if (isExisted) throw new Error("User Already Registered");

  const newUser = new User({ name, email, password });
  const userDoc = await newUser.save();
  return userDoc;
};

const login = async (data, socket) => {
  const { email, password } = data;

  const userDoc = await User.findOne({ email });

  if (!userDoc) throw new Error("User Not Found");

  if (userDoc.password !== password) throw new Error("Incorrect Password");

  // access_token
  const access_token = await generateToken({
    userId: userDoc._id,
    expiresIn: ACCESS_TOKEN_EXPIRY,
    secret: JWT_SECRET,
    aud: authTypes.USER,
  });

  // refresh token
  const refresh_token = await generateToken({
    userId: userDoc._id,
    expiresIn: REFRESH_TOKEN_EXPIRY,
    secret: JWT_SECRET,
    aud: authTypes.USER,
  });

  if (socket) {
    const socketId = socket?.id;

    socket.handshake.auth = {
      ...socket.handshake.auth,
      access_token,
      refresh_token,
    };
    await User.findByIdAndUpdate(userDoc._id, {
      socketId: socketId,
      isOnline: true,
    });
  }

  const userDocUpdated = await User.findById(userDoc._id);

  Emitter.emit(EventCases.SEND_WELCOME_MAIL, { user: userDoc });

  return {
    user: userDocUpdated,
    access_token,
    refresh_token,
  };
};

const logout = async (socketId) => {
  await User.findOneAndUpdate(
    { socketId },
    { isOnline: false, lastSeen: new Date() }
  );
};

const verifyAndDecodeToken = (token, token_secret) => {
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, token_secret);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return {
          code: 401,
          error_message: "token_has_expired",
        };
      } else if (err instanceof jwt.JsonWebTokenError) {
        return {
          code: 401,
          error_message: "token_is_invalid",
        };
      } else {
        return {
          code: 401,
          error_message: "token_verification_failed",
        };
      }
    }

    if (!decoded) {
      return {
        code: 401,
        error_message: "token_verification_failed",
      };
    }

    return { code: 200, data: decoded };
  } catch (error) {
    return {
      code: 401,
      error_message: error.message,
    };
  }
};

const socketAuth = async (socket, next) => {
  // Extract the access token from the handshake
  const access_token =
    socket?.handshake?.headers?.access_token ||
    socket?.handshake?.auth?.access_token;

  if (!access_token) {
    socket.emit("error", { message: "Access token is required" });
    return next(new Error("Access token is required"));
  }

  // Verify and decode the token
  const { data, error_message, code } = verifyAndDecodeToken(
    access_token,
    JWT_SECRET
  );

  if (error_message) {
    socket.emit("error", { message: error_message, code });
    return next(new Error(error_message));
  }

  // Extract user data from the decoded token
  const { userId, aud } = data;

  // Handle based on the audience type
  switch (aud) {
    case authTypes.USER:
      const userDoc = await User.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });

      if (!userDoc) {
        socket.emit("error", { message: "User not found" });
        return next(new Error("User not found"));
      }

      // Attach user document to handshake for future use
      socket.handshake.auth = {
        ...socket.handshake.auth,
        user: userDoc,
      };
      return next(); // Proceed to the next middleware

    case authTypes.ADMIN:
      const adminDoc = await User.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });

      if (!adminDoc) {
        socket.emit("error", { message: "Admin not found" });
        return next(new Error("Admin not found"));
      }

      // Attach admin document to handshake for future use
      socket.handshake.auth = {
        ...socket.handshake.auth,
        admin: adminDoc,
      };
      return next(); // Proceed to the next middleware

    default:
      socket.emit("error", { message: "Invalid audience type (aud)" });
      return next(new Error("Invalid audience type (aud)"));
  }
};

const expressAuth = () => async (req, res, next) => {
  let access_token =
    req.headers["authorization"]?.split(" ")[1] || req.cookies["access_token"];

  const { data, error_message, code } = verifyAndDecodeToken(
    access_token,
    JWT_SECRET
  );

  if (error_message) {
    return res.status(code).json({ error: new Error(error_message) });
  }

  const { userId, aud } = data;

  switch (aud) {
    case authTypes.USER:
      const userDoc = await User.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });

      req.user = userDoc;
      next();

      break;
    case authTypes.ADMIN:
      const adminDoc = await User.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });

      req.admin = adminDoc;
      next();
      break;

    default:
      return res
        .status(401)
        .json({ error: new Error("invalid aud (authType)") });
  }
};
const organizationAuth = () => async (req, res, next) => {
  let access_token =
    req.headers["authorization"]?.split(" ")[1] || req.cookies["access_token"];

  const { data, error_message, code } = verifyAndDecodeToken(
    access_token,
    JWT_SECRET
  );

  if (error_message) {
    return res.status(code).json({ error: new Error(error_message) });
  }

  const { userId } = data;

  const userDoc = await User.findOne({
    _id: new mongoose.Types.ObjectId(userId),
  });

  req.organization = userDoc;
  next();
};

const refreshTokens = async (refresh_token_old) => {
  const { data, error_message, code } = verifyAndDecodeToken(
    refresh_token_old,
    JWT_SECRET
  );

  if (error_message) {
    throw new Error(error_message);
  }

  const { userId, aud } = data;
  let access_token;
  let refresh_token;
  switch (aud) {
    case authTypes.USER:
      const userDoc = await User.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });
      access_token = await generateToken({
        userId: userDoc._id,
        expiresIn: ACCESS_TOKEN_EXPIRY,
        secret: JWT_SECRET,
        aud: authTypes.USER,
      });

      refresh_token = await generateToken({
        userId: userDoc._id,
        expiresIn: REFRESH_TOKEN_EXPIRY,
        secret: JWT_SECRET,
        aud: authTypes.USER,
      });

      return {
        access_token,
        refresh_token,
      };

    case authTypes.ADMIN:
      const adminDoc = await User.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });

      access_token = await generateToken({
        userId: adminDoc._id,
        expiresIn: ACCESS_TOKEN_EXPIRY,
        secret: JWT_SECRET,
        aud: authTypes.ADMIN,
      });
      refresh_token = await generateToken({
        userId: adminDoc._id,
        expiresIn: REFRESH_TOKEN_EXPIRY,
        secret: JWT_SECRET,
        aud: authTypes.ADMIN,
      });
      return {
        access_token,
        refresh_token,
      };

    default:
      throw new Error("invalid aud");
      break;
  }
};

const refreshTokensSocket = async (socket) => {
  const refresh_token_old =
    socket?.handshake?.headers?.refresh_token ||
    socket?.handshake?.auth?.refresh_token;

  const { access_token, refresh_token } = await refreshTokens(
    refresh_token_old
  );

  if (socket) {
    socket.handshake.auth = {
      ...socket.handshake.auth,
      access_token,
      refresh_token,
    };
  }

  return {
    access_token,
    refresh_token,
  };
};

const refreshTokenAPI = async (refresh_token_old) => {
  const { access_token, refresh_token } = await refreshTokens(
    refresh_token_old
  );

  return {
    access_token,
    refresh_token,
  };
};

module.exports = {
  logout,
  register,
  login,
  socketAuth,
  organizationAuth,
  expressAuth,
  refreshTokenAPI,
  refreshTokensSocket,
  generateToken,
};
