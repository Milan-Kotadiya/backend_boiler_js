process.on("message", async (emailData) => {
  try {
    console.log(emailData, "emailData");
    // Send success response to parent
    process.send({ success: true, message: "Email sent successfully!", info });
  } catch (error) {
    // Send failure response to parent
    process.send({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }

  process.exit();
});
