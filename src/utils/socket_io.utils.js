const logger = require("../logger/logger");

class SocketError extends Error {
  constructor(
    status,
    message,
    errorDescription,
    errorType = "",
    isOperational = true,
    stack = ""
  ) {
    super(message);
    this.message = message;
    this.errorDescription = errorDescription;
    this.custom_errors = message;
    this.status = status;
    this.errorType = errorType;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Async wrapper to handle async socket events with error handling
const catchSocketAsync = (fn) => (data, ack) => {
  Promise.resolve(fn(data, ack)).catch((err) => {
    logger.error(`Socket error: ${JSON.stringify(err)}`);
    ack(err);
  });
};

// Create a custom socket acknowledgment response object
const createSocketResponseObject = ({
  message = "",
  payload = {},
  code,
  type,
}) => {
  message = message;

  return { code: code, message: message, type: type, payload: payload };
};

// Create socket acknowledgment response (success or failure)
const sendAckResponse = (ack, success, message, payload = {}) => {
  logger.info(
    `ACK: ${JSON.stringify({
      success: success,
      message: message,
    })}`
  );

  ack({
    success: success,
    message: message,
    payload: payload,
  });
};

module.exports = {
  SocketError,
  catchSocketAsync,
  createSocketResponseObject,
  sendAckResponse,
};
