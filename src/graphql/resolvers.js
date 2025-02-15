const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require('../models/user.model')

const resolvers = {
  Query: {
    getUser: async (_, { id }) => {
      try {
        return await User.findById(id);
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        throw new Error("Failed to fetch user");
      }
    },
    getUsers: async () => {
      try {
        return await User.find({});
      } catch (error) {
        console.error("❌ Error fetching users:", error);
        throw new Error("Failed to fetch users");
      }
    },
  },

  Mutation: {
    register: async (_, { username, password, email }, { pubsub }) => {
      console.log("🔹 Register Mutation Started for:", username);
      try {
        if (await User.findOne({ username })) {
          console.log("❌ Username already exists:", username);
          throw new Error("Username already exists.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, email });
        const savedUser = await user.save();

        console.log("✅ User registered successfully:", savedUser.username);
        pubsub.publish("USER_REGISTERED", { userRegistered: savedUser });

        return savedUser;
      } catch (error) {
        console.error("❌ Error in register mutation:", error);
        throw new Error("Failed to register user.");
      }
    },

    login: async (_, { email, password }, { pubsub }) => {
      console.log("🔹 Login Mutation Started for:", email);
      try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
          console.log("❌ Invalid credentials for email:", email);
          throw new Error("Invalid credentials");
        }

        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET || "your_secret_key",
          { expiresIn: "1h" }
        );

        console.log("✅ User logged in successfully:", email);
        pubsub.publish("USER_LOGGED", { userLogged: { token, user } });

        return { token, user };
      } catch (error) {
        console.error("❌ Error in login mutation:", error);
        throw new Error("Login failed.");
      }
    },
  },

  Subscription: {
    userRegistered: {
      subscribe: (_, __, { pubsub }) => {
        console.log("📡 Subscription started for userRegistered");
        return pubsub.asyncIterableIterator("USER_REGISTERED");
      },
    },
    userLogged: {
      subscribe: (_, __, { pubsub }) => {
        console.log("✅ Subscription context received:", pubsub);
        if (!pubsub) {
          throw new Error("❌ PubSub is undefined in context");
        }
        console.log("✅ PubSub is working correctly");
        return pubsub.asyncIterableIterator("USER_LOGGED");
      },
    },
  },
};

module.exports = resolvers;
