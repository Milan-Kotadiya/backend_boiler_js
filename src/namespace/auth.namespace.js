const { catchSocketAsync } = require("../utils/socket_io.utils");
const {
  userRegisterSchema,
  userLoginSchema,
} = require("../validations/user.validation");
const { socketValidateSchema } = require("../validations/validation");
const authSocketController = require("../controller/auth.socket.controller");
const logger = require("../logger/logger");

module.exports = (io) => {
  const authNameSpace = io.of("/auth");

  authNameSpace.on("connection", (socket) => {
    socket.onAny(async (eventName, data) => {
      logger.info(`EVENT: [AUTH/${eventName.toUpperCase()}]`);
    });

    socket.on(
      "register",
      catchSocketAsync(async (data, ack) => {
        //  validation
        socketValidateSchema(userRegisterSchema, data, ack);
        // proceed with registration logic
        await authSocketController.register(socket, data, ack);
      })
    );

    socket.on(
      "login",
      catchSocketAsync(async (data, ack) => {
        //  validation
        socketValidateSchema(userLoginSchema, data, ack);
        // proceed with registration logic
        await authSocketController.login(socket, data, ack);
      })
    );

    socket.on(
      "refresh_token",
      catchSocketAsync(async (data, ack) => {
        // proceed with registration logic
        await authSocketController.refreshToken(socket, data, ack);
      })
    );
  });

  return authNameSpace;
};
