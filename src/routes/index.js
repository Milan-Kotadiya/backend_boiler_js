const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const testRoutes = require("./test.routes");
const organizationRoutes = require("./organization.routes");
const { organizationAuth } = require("../services/auth.service");

router.use("/auth", authRoutes);
router.use("/test", testRoutes);
router.use("/organization", organizationAuth(), organizationRoutes);

module.exports = router;
