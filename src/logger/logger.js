// logger.js
const { createLogger, format, transports } = require('winston');

// Define custom log levels and colors
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    verbose: 'magenta',
    debug: 'blue',
    silly: 'rainbow',
  },
};

// Add colors to Winston
require('winston').addColors(customLevels.colors);

// Custom format for colorful logs
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize(), // Adds color to logs
  format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] [${level}] ${message}`;
  })
);

// File format (without colors for better readability in files)
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Create a logger instance
const logger = createLogger({
  levels: customLevels.levels,
  level: 'info', // Default level
  transports: [
    // Console transport with colors
    new transports.Console({
      format: customFormat,
    }),
    // // File transport for errors
    // new transports.File({
    //   filename: 'logs/error.log',
    //   level: 'error',
    //   format: fileFormat,
    // }),
    // // File transport for combined logs
    // new transports.File({
    //   filename: 'logs/combined.log',
    //   format: fileFormat,
    // }),
  ],
});

module.exports = logger;
