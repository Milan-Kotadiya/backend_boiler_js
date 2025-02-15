const redis = require("redis");
const logger = require("../logger/logger");
const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
} = require("../config/dotenv.config");

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: REDIS_HOST, // Hostname
        port: REDIS_PORT, // Port
        reconnectStrategy: (retries) => Math.min(retries * 50, 500), // Custom reconnect strategy
      },
      password: REDIS_PASSWORD || undefined, // Use password if provided
    });

    redisClient.on("connect", () => {
      logger.info("Connected to Redis");
    });

    redisClient.on("error", (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    await redisClient.connect();
  } catch (err) {
    logger.error(`Error connecting to Redis: ${err.message}`);
  }
};

// Redis Set (Create/Update) function
const RedisSet = async (key, value, expiration) => {
  try {
    if (!redisClient.isOpen) {
      logger.error("Redis client is not connected.");
      return;
    }

    const jsonValue = JSON.stringify(value);

    if (expiration) {
      await redisClient.set(key, jsonValue, "EX", expiration);
    } else {
      await redisClient.set(key, jsonValue);
    }
  } catch (err) {
    logger.error(`Error setting key "${key}":`, err);
  }
};

// Redis Get (Read) function
const RedisGet = async (key) => {
  try {
    // Make sure Redis client is connected
    if (!redisClient.isOpen) {
      logger.error("Redis client is not connected.");
      return null;
    }

    const value = await redisClient.get(key);

    if (value) {
      return JSON.parse(value);
    } else {
      return null;
    }
  } catch (err) {
    logger.error(`Error getting key "${key}":`, err);
    return null;
  }
};

// Redis Delete (Delete) function
const RedisDelete = async (key) => {
  try {
    // Make sure Redis client is connected
    if (!redisClient.isOpen) {
      logger.error("Redis client is not connected.");
      return;
    }

    await redisClient.del(key);
  } catch (err) {
    logger.error(`Error deleting key "${key}":`, err);
  }
};

// Export the functions
module.exports = {
  connectRedis,
  RedisSet,
  RedisGet,
  RedisDelete,
  redisClient,
};
