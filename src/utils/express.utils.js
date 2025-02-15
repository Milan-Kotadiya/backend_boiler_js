const mongoose = require("mongoose");
const httpStatus = require("http-status").default;
const { NODE_ENV } = require("../config/dotenv.config");
const logger = require("../logger/logger");

class ApiError extends Error {
  constructor(
    statusCode,
    message,
    errorDescription,
    errorType = "",
    isOperational = true,
    stack = ""
  ) {
    super(message, errorDescription);
    this.message = message;
    this.errorDescription = errorDescription;
    this.custom_errors = message;
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

const createResponseObject = ({
  req,
  message = "",
  payload = {},
  code,
  type,
}) => {
  // const locale = req.headers.locale ? req.headers.locale : "en";
  // const messageInLocale = require(`../../public/locales/${locale}/backendMessages.json`);
  message = message; // messageInLocale["API_MESSAGES"][message]

  return { code: code, message: message, type: type, payload: payload };
};

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(
      statusCode,
      message,
      "",
      error?.errorType || "",
      false,
      err.stack
    );
  }

  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message, errorDescription = "", errorType = "" } = err;
  if (NODE_ENV === "production" && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  if (NODE_ENV === "development") {
    logger.error(err);
  }

  logger.error(
    `${req.originalUrl} - Error caught by error-handler (router.js): ${err.message}\n${err.stack}`
  );

  let data4responseObject = {
    req: req,
    code: statusCode,
    message: message,
    type: errorType,
    payload: {
      error: errorDescription,
    },
  };

  res.status(statusCode).send(createResponseObject(data4responseObject));
};


module.exports = {
  ApiError,
  pick,
  catchAsync,
  createResponseObject,
  errorConverter,
  errorHandler,
};
