const express = require("express");
const ejs = require("ejs");
const path = require("path");
const { PUBLIC_PATH, PROJECT_ROOT_PATH } = require("../config/paths.config");
const { getPuppeteer } = require("../connections/puppeteer.connection");
const { saveFile } = require("../utils/file_system.utils");
const { sendMail } = require("../connections/mail.server");
const { createSubscriptionPlan } = require("../services/razorpay.service");
const {
  getCookie,
  deleteCookie,
  setCookie,
} = require("../utils/cookies.utils");
const { NODE_ENV } = require("../config/dotenv.config");
const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Hello, World!");
});

router.get("/set_cookie", async (req, res) => {
  console.log(req.cookies);

  // deleteCookie(res,'set_cookie');

  // res.cookie("set_cookie", JSON.stringify({ name: "set_cookie" }), {
  //   maxAge: 3600 * 1000, // 1 hour
  //   path: req.path, // Specific path
  //   httpOnly: true, // Prevent client-side JavaScript access
  //   secure: NODE_ENV === "production", // Use only over HTTPS in production
  //   sameSite: "lax", // Adjust based on cross-site behavior
  // });

  // setCookie(res, "set_cookie", JSON.stringify({ name: "set_cookie" }), {
  //   maxAge: 3600, // 1-hour expiry
  //   path: req.path, // Make path explicit to ensure it works across different endpoints
  // });

  res.send("Done!");
});

router.get("/test_razorpay", async (req, res) => {
  const data = req.body;

  //   {
  //     "period": "monthly", // Could be "monthly" or "yearly"
  //     "interval": 1, // Interval for the period, e.g., 1 for monthly, 12 for yearly
  //     "name": "Premium Subscription", // Name of the subscription plan
  //     "amount": 499, // The amount in the smallest unit of the currency, e.g., 499 paise for INR, 499 cents for USD
  //     "currency": "INR", // The currency in which the amount is charged
  //     "description": "Unlock all premium features for one month.", // Description of the plan
  //     "notes": "Auto-renewal every month" // Additional notes or details about the plan
  // }

  const planObj = {
    period: data?.period,
    interval: data?.interval,
    item: {
      name: data?.name,
      amount: data?.amount * 100,
      currency: data?.currency,
      description: data?.description,
    },
    notes: {
      notes_key_1: data?.notes,
    },
  };

  const PlanDetail = await createSubscriptionPlan({ planData: planObj });
  res.send({ data: PlanDetail });
});

router.get("/test_mail", async (req, res) => {
  const emailTemplatePath = path.join(
    PROJECT_ROOT_PATH,
    `/src/mails/auth/verification_code.html`
  );

  const emailTemplate = await ejs.renderFile(emailTemplatePath, {
    email: "milan.kotadiya@nexuslinkservices.in",
    otp: "123456",
  });

  await sendMail(
    "milan.kotadiya@nexuslinkservices.in",
    "Verify Email",
    emailTemplate
  );

  res.send({ status: "ok" });
});

router.get("/test_puppeteer_check", async (req, res) => {
  const emailTemplatePath = path.join(
    PROJECT_ROOT_PATH,
    `/src/mails/auth/verification_code.html`
  );

  const renderedHtml = await ejs.renderFile(emailTemplatePath, {
    email: "milan.kotadiya@nexuslinkservices.in",
    otp: "123456",
  });

  // Launch Puppeteer
  const browser = await getPuppeteer();

  const page = await browser.newPage();

  // Set the rendered HTML as the page content
  await page.setContent(renderedHtml, { waitUntil: "load" });

  const dirPath = path.resolve(PUBLIC_PATH, "invoice"); // dirPath =  public/invoice
  const filePath = path.join(dirPath, `/invoice.pdf`); // filePath = public/invoice/invoice.pdf

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      left: "10px",
      right: "10px",
      top: "10px",
      bottom: "10px",
    },
  });

  saveFile(dirPath, filePath, pdfBuffer);

  browser.close();

  res.status(200).sendFile(filePath);
});

module.exports = router;
