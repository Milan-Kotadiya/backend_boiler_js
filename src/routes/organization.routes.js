const express = require("express");
const {
  userLoginSchema,
  userRegisterSchema,
} = require("../validations/user.validation");
const { expressValidateSchema } = require("../validations/validation");
const authController = require("../controller/organization/auth.controller");
const router = express.Router();

router.post(
  "/auth/register",
  expressValidateSchema(userRegisterSchema, "body"),
  authController.register
);
router.post(
  "/auth/login",
  expressValidateSchema(userLoginSchema, "body"),
  authController.login
);

module.exports = router;
