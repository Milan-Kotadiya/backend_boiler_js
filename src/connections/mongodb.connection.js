const mongoose = require("mongoose");
const logger = require("../logger/logger");
const { DB_HOST, DB_PORT, DB_NAME } = require("../config/dotenv.config");
const User = require("../models/user.model");

const tenentConnectionMap = new Map();

const getTenantConnection = async (tenantId) => {
  if (tenentConnectionMap.has(tenantId)) {
    return tenentConnectionMap.get(tenantId);
  }

  const database = await mongoose.createConnection(
    `mongodb://${DB_HOST}:${DB_PORT}/${tenantId}`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  );

  tenentConnectionMap.set(tenantId, database);
  return database;
};

const initializeTenants = async () => {
  // Fetch all tenants
  const tenants = await User.find({}, "_id");

  // Create a connection for each tenant
  for (const tenant of tenants) {
    await getTenantConnection(tenant._id.toString());
  }

  logger.info("🎯 Multi-Tenant Connections setup complete!");
};

const connectMongoDB = async () => {
  try {
    await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    logger.info("Connected to MongoDB");
    await initializeTenants();
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { connectMongoDB, getTenantConnection, tenentConnectionMap };
