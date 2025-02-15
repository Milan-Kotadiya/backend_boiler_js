const httpStatus = require("http-status").default;
const { createResponseObject, catchAsync } = require("../utils/express.utils");
const authService = require("../services/auth.service");
const auth0Service = require("../services/auth0.service");

const register = catchAsync(async (req, res) => {
  const userDoc = await authService.register(req.body, null);

  const data4responseObject = {
    req: req,
    code: httpStatus.OK,
    message: "register_successfully",
    payload: { result: userDoc },
    logPayload: false,
  };

  res.status(httpStatus.OK).send(createResponseObject(data4responseObject));
});

const login = catchAsync(async (req, res) => {
  const userDoc = await authService.login(req.body, null);

  const data4responseObject = {
    req: req,
    code: httpStatus.OK,
    message: "login_successfully",
    payload: { result: userDoc },
    logPayload: false,
  };

  res.status(httpStatus.OK).send(createResponseObject(data4responseObject));
});

const refreshToken = catchAsync(async (req, res) => {
  const tokenDocs = await authService.refreshTokenAPI(req.body.refresh_token);

  const data4responseObject = {
    req: req,
    code: httpStatus.OK,
    message: "token_refreshed_successfully",
    payload: { result: tokenDocs },
    logPayload: false,
  };

  res.status(httpStatus.OK).send(createResponseObject(data4responseObject));
});

const authCallback = catchAsync(async (req, res) => {
  const tokenDocs = await auth0Service.auth0Callback({
    res: res,
    query: req.query,
  });

  const data4responseObject = {
    req: req,
    code: httpStatus.OK,
    message: "authenticated_successfully",
    payload: { result: tokenDocs },
    logPayload: false,
  };

  res.status(httpStatus.OK).send(createResponseObject(data4responseObject));
});
const authLink = catchAsync(async (req, res) => {
  const link = auth0Service.generateAuth0LoginLink();

  const data4responseObject = {
    req: req,
    code: httpStatus.OK,
    message: "link_generated_successfully",
    payload: { result: { link } },
    logPayload: false,
  };

  res.status(httpStatus.OK).send(createResponseObject(data4responseObject));
});

module.exports = {
  register,
  login,
  refreshToken,
  authCallback,
  authLink,
};
