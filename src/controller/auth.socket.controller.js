const {
  SocketError,
  createSocketResponseObject,
  sendAckResponse,
} = require("../utils/socket_io.utils");
const authService = require("../services/auth.service");

const register = async (socket, data, ack) => {
  try {
    const userDoc = await authService.register(data, socket);

    const response = createSocketResponseObject({
      socket: socket,
      message: "register_successfully",
      payload: { result: userDoc },
      code: 200,
      type: "registration",
    });

    sendAckResponse(ack, true, response.message, response.payload);
  } catch (error) {
    throw new SocketError(false, error.message, error);
  }
};

const login = async (socket, data, ack) => {
  try {
    const userDoc = await authService.login(data, socket);

    const response = createSocketResponseObject({
      socket: socket,
      message: "login_successfully",
      payload: { result: userDoc },
      code: 200,
      type: "registration",
    });

    sendAckResponse(ack, true, response.message, response.payload);
  } catch (error) {
    throw new SocketError(false, error.message, error);
  }
};

const refreshToken = async (socket, data, ack) => {
  try {
    const tokenDocs = await authService.refreshTokensSocket(socket);

    const response = createSocketResponseObject({
      socket: socket,
      message: "token_refreshed_successfully",
      payload: { result: tokenDocs },
      code: 200,
      type: "registration",
    });

    sendAckResponse(ack, true, response.message, response.payload);
  } catch (error) {
    throw new SocketError(false, error.message, error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
};
