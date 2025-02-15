const { connectMongoDB } = require("./connections/mongodb.connection");
const { createHttpServer } = require("./connections/http.server");
const { createGraphQlServer } = require("./connections/graphql.server");
const { connectRedis, redisClient } = require("./connections/redis.connection");
const logger = require("./logger/logger");
const { connectMailServer } = require("./connections/mail.server");
const configuredEnv = require("./config/dotenv.config");
const EmitterListener = require("./services/emitter.service");
const initAgenda = require("./services/agenda.service");
const { s3BucketConnection } = require("./connections/s3bucket.connection");
const { createSocketServer } = require("./connections/socket.server");
const app = require("./connections/express.server");

const validateEnv = () => {
  const keys = Object.keys(configuredEnv);
  keys?.forEach((key) => {
    if (configuredEnv[key] == undefined) {
      logger.warn(`ENV INVALID VALUE "${key}".`);
    }
  });
  return;
};

async function init() {
  validateEnv();
  await connectRedis();
  await connectMongoDB();
  await connectMailServer();
  const httpServer = await createHttpServer();
  createSocketServer(httpServer);
  await createGraphQlServer(httpServer, app);

  await s3BucketConnection();
  await initAgenda();
  EmitterListener();

  httpServer.listen(configuredEnv.PORT, () => {
    logger.info(`Server is running on ${configuredEnv.BASE_URL}`);
  });
}

init();

async function gracefulShutdown(server, redisClient) {
  try {
    logger.info("Shutting down gracefully...");
    if (redisClient) {
      logger.info("Closing Redis connection...");
      await redisClient.disconnect();
    }
    logger.info("Closing HTTP server...");
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });
  } catch (err) {
    logger.error(`Error during shutdown: ${err.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => gracefulShutdown(server, redisClient));
process.on("SIGTERM", () => gracefulShutdown(server, redisClient));

// Handle unhandled errors
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Chunk Upload And Get Cstrimming
// Mongo Hooks, Static & Methods
