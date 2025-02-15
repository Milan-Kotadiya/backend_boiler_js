const httpStatus = require("http-status").default;
const { ApiError } = require("../utils/express.utils");
const { SocketError } = require("../utils/socket_io.utils");

const expressValidateSchema = (schema, key) => (req, res, next) => {
  const data = req[key];

  const { error } = schema.validate(data, {
    abortEarly: false,
  });

  if (error) {
    const errorData = {};
    error.details.forEach((item) => {
      errorData[item.context.key] = item.message;
    });
    return next(
      new ApiError(
        httpStatus.BAD_REQUEST,
        "validation_error",
        errorData,
        "VALIDATION"
      )
    );
  }

  return next();
};

const socketValidateSchema = (schema, data, ack) => {
  const { error } = schema.validate(data, {
    abortEarly: false,
  });

  if (error) {
    const errorData = {};
    error.details.forEach((item) => {
      errorData[item.context.key] = item.message;
    });

    throw new SocketError(false, "validation_error", errorData, "VALIDATION");
  }
};

module.exports = { expressValidateSchema, socketValidateSchema };
