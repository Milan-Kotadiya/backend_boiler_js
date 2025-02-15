const express = require("express");
const httpStatus = require("http-status").default;
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("../logger/logger");
const routes = require("../routes/index");
const {
  CORS_ORIGIN,
  RESTRICTION_MINUTES,
  MAX_VISIT_LIMIT,
  TRACK_SITE_VISIT,
} = require("../config/dotenv.config");
const { UPLOAD_PATH, PUBLIC_PATH } = require("../config/paths.config");
const {
  errorConverter,
  errorHandler,
  createResponseObject,
} = require("../utils/express.utils");
const rateLimit = require("express-rate-limit");

const app = express();

const limiter = rateLimit({
  windowMs: Number(RESTRICTION_MINUTES) * 60 * 1000, // 15 minutes
  max: Number(MAX_VISIT_LIMIT), // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

if (TRACK_SITE_VISIT == "true") {
  app.use(limiter);
}

const corsOpts = {
  origin: CORS_ORIGIN,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

app.use(cors(corsOpts));
app.use(cookieParser());
app.use(express.json());

// Middleware to log incoming requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url.toUpperCase()}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).send("Something went wrong!");
});

app.use("/api/uploads", express.static(UPLOAD_PATH));
app.use("/api/public", express.static(PUBLIC_PATH));

// Cookie Middleware For Track Visit Count
// app.use("/api/v1/", siteVisitMonitor);

// Set up routes
app.use("/api/v1/", routes);

app.all("*", function (req, res, next) {
  res.status(httpStatus.BAD_REQUEST).json(
    createResponseObject({
      req: req,
      message: "Sorry! The request could not be processed!",
      payload: {},
      logPayload: false,
    })
  );
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
