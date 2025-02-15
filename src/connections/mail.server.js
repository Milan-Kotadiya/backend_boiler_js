const nodemailer = require("nodemailer");
const {
  MAILER_HOST,
  MAILER_PORT,
  MAILER_SECURE,
  MAILER_USERNAME,
  MAILER_PASSWORD,
  MAILER_FROM,
} = require("../config/dotenv.config");
const logger = require("../logger/logger");

const transporter = nodemailer.createTransport({
  host: MAILER_HOST,
  port: MAILER_PORT,
  secure: MAILER_SECURE == "true",
  auth: {
    user: MAILER_USERNAME,
    pass: MAILER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const connectMailServer = async () => {
  transporter
    .verify()
    .then(() => logger.info("Connected to Mail Server"))
    .catch(() =>
      logger.warn(
        "Unable to connect to email server. Make sure you have configured the MAILER options in .env"
      )
    );
};

const sendMail = async (to, subject, htmlToSend, cc, bcc, attachments) => {
  try {
    const mailOptions = {
      from: MAILER_FROM,
      to,
      subject,
      html: htmlToSend,
      attachments,
      cc,
      bcc,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Mail Sent!! To:${to} Sub:${subject}`);
  } catch (error) {
    logger.error(`Fail To Send Mail. error: ${error.message}`);
  }
};

module.exports = {
  sendMail,
  connectMailServer,
};
