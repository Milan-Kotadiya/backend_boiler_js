const fs = require("fs");
const http = require("http");
const https = require("https");
const app = require("./express.server");
const logger = require("../logger/logger");
const {
  NODE_ENV,
  PORT,
  KEY_PATH,
  CERT_PATH,
  BASE_URL,
} = require("../config/dotenv.config");
const { PROJECT_ROOT_PATH } = require("../config/paths.config");
const path = require("path");

let protocol;

const createHttpServer = () => {
  try {
    const isProduction = NODE_ENV !== "development"; // Check if it's not development
    const options = {};

    if (isProduction) {
      const keyPath = path.join(PROJECT_ROOT_PATH, KEY_PATH);
      const certPath = path.join(PROJECT_ROOT_PATH, CERT_PATH);

      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        options.key = fs.readFileSync(keyPath);
        options.cert = fs.readFileSync(certPath);
        logger.info("SSL certificates loaded successfully");
        protocol = "https";
      } else {
        logger.warn("SSL certificates not found. Falling back to HTTP.");
        protocol = "http";
      }
    } else {
      protocol = "http";
    }

    // Create HTTPS server if certificates are available, otherwise HTTP
    server =
      options.key && options.cert
        ? https.createServer(options, app)
        : http.createServer(app);

    return server;
  } catch (error) {
    logger.error("Error creating server:", error);
    throw error;
  }
};

module.exports = { createHttpServer };
