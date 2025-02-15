const express = require("express");
const {
  userLoginSchema,
  userRegisterSchema,
  refreshTokenSchema,
} = require("../validations/user.validation");
const { expressValidateSchema } = require("../validations/validation");
const authController = require("../controller/auth.controller");
const router = express.Router();

router.post(
  "/register",
  expressValidateSchema(userRegisterSchema, "body"),
  authController.register
);
router.post(
  "/login",
  expressValidateSchema(userLoginSchema, "body"),
  authController.login
);
router.post(
  "/refresh_token",
  expressValidateSchema(refreshTokenSchema, "body"),
  authController.refreshToken
);

router.get(
  "/auth_0/get_link",
  authController.authLink
);
router.get(
  "/auth_0/callback",
  authController.authCallback
);

module.exports = router;
