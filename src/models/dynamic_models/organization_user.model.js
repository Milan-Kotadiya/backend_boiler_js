const mongoose = require("mongoose");
const { getTenantConnection } = require("../../connections/mongodb.connection");

const userSchema = new mongoose.Schema(
  {
    authMethod: {
      type: String,
      default: "custom",
    },
    authId: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String, // Store a URL or file path
      default: null,
    },
    profilePictureLink: {
      type: String, // Store a URL or file path
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt`
  }
);

const getUsersModel = async (organizationId) => {
  const database = await getTenantConnection(organizationId);

  return database.model("User", userSchema);
};

module.exports = getUsersModel;
