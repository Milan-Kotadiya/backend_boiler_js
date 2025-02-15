const jwt = require("jsonwebtoken");
const httpStatus = require("http-status").default;
const axios = require("axios");
const authService = require("./auth.service");

const {
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_CLIENT_REDIRECT_URL,
  REFRESH_TOKEN_EXPIRY,
  JWT_SECRET,
  AUTH0_SCOPE,
  ACCESS_TOKEN_EXPIRY,
  BASE_URL,
} = require("../config/dotenv.config");
const { authTypes } = require("../constants/event.handler");
const User = require("../models/user.model");
const { ApiError } = require("../utils/express.utils");

const auth0Callback = async ({ query, res }) => {
  try {
    const { code } = query;

    const tokenResponse = await axios.post(
      `https://${AUTH0_DOMAIN}/oauth/token`,
      {
        grant_type: "authorization_code",
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        code: code,
        redirect_uri: `${BASE_URL}${AUTH0_CLIENT_REDIRECT_URL}`,
      }
    );

    const { id_token } = tokenResponse?.data;

    const decodedIdToken = jwt.decode(id_token); // Decoding the id token

    const { sub, name, email, picture } = decodedIdToken;

    const authMethod = sub.split("|")[0];
    const authId = sub.split("|")[1];

    const isExisted = await User.findOne({ authMethod, authId });

    if (isExisted) {
      const access_token = await authService.generateToken({
        userId: isExisted._id,
        expiresIn: ACCESS_TOKEN_EXPIRY,
        secret: JWT_SECRET,
        aud: authTypes.USER,
      });

      // refresh token
      const refresh_token = await authService.generateToken({
        userId: isExisted._id,
        expiresIn: REFRESH_TOKEN_EXPIRY,
        secret: JWT_SECRET,
        aud: authTypes.USER,
      });

      return {
        access_token: access_token,
        refresh_token: refresh_token,
      };
    } else {
      const newUser = new User({
        name,
        email,
        authMethod,
        authId,
        profilePictureLink: picture,
      });
      const userDoc = await newUser.save();

      const access_token = await authService.generateToken({
        userId: userDoc._id,
        expiresIn: ACCESS_TOKEN_EXPIRY,
        secret: JWT_SECRET,
        aud: authTypes.USER,
      });

      // refresh token
      const refresh_token = await authService.generateToken({
        userId: userDoc._id,
        expiresIn: REFRESH_TOKEN_EXPIRY,
        secret: JWT_SECRET,
        aud: authTypes.USER,
      });

      return {
        access_token: access_token,
        refresh_token: refresh_token,
      };
    }
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Internal Server Error",
      error
    );
  }
};

const generateAuth0LoginLink = () => {
  return `https://${AUTH0_DOMAIN}/authorize?response_type=code&client_id=${AUTH0_CLIENT_ID}&redirect_uri=${BASE_URL}${AUTH0_CLIENT_REDIRECT_URL}&scope=${AUTH0_SCOPE}`;
};
module.exports = {
  auth0Callback,
  generateAuth0LoginLink,
};

// FLOW
// CREATE AUTH0 APP
// GET DETAILS LIKE AUTH0_DOMAIN,AUTH0_CLIENT_ID,AUTH0_CLIENT_SECRET,AUTH0_AUDIENCE
// SET GRANT TYPE PASSWORD IN APP > SETTINGS > ADVANCE
// GOTO DASHBOARD > API > SELECT APP >
//            1. PERMISSION > Add read and write
//            2. MACHINE TO MACHINE APPLICATION > SELECT APP > Authorization TRUE AND ADD Select Read And Write
//

// LOGIN IN AUTH0 VIA SDK, GET TOKEN
// LOGIN URL WILL BE `https://${AUTH0_DOMAIN}/authorize?response_type=code&client_id=${AUTH0_CLIENT_ID}&redirect_uri=${BASE_URL}${AUTH0_CLIENT_REDIRECT_URL}&scope=${AUTH0_SCOPE}`
// LOGIN METHOD GET

// LOGIN VIA EXPRESS API (OUR SERVER) SEND AUTH0_TOKEN,
// FROM AUTH0_TOKEN GET USER VIA MATCH TOKEN_ID FROM OUR DATA BASE
// IF USER NOT FOUND THEN GET DATA FROM
// GET IT FROM getAuth0UserInfo CREATE USER
// CREATE ACCESS AND REFRESH TOKEN AND SEND RESPONSE
