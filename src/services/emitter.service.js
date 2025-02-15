const { PROJECT_ROOT_PATH } = require("../config/paths.config");
const Emitter = require("../connections/event-emitter.connection");
const { EventCases } = require("../constants/event.handler");
const { fork } = require("child_process");
const path = require("path");

const EmitterListener = () => {
  Emitter.on(EventCases.SEND_WELCOME_MAIL, async (data) => {
    const child = fork(
      path.join(PROJECT_ROOT_PATH, "child_process/send_mail.js")
    );

    const emailData = {
      ...data,
      to: "receiver@example.com",
      subject: "Test Email from Child Process",
      text: "Hello! This is a test email sent using a child process.",
    };

    child.send(emailData);

    child.on("message", (message) => {
      console.log("Received from child:", message);
    });

    child.on("exit", (code) => {
      console.log(`Child process exited with code ${code}`);
    });

    child.on("error", (err) => {
      console.error("Child process error:", err);
    });

    child.on("close", (code) => {
      console.log(`Child process closed with code ${code}`);
    });
  });
};

module.exports = EmitterListener;
