const puppeteer = require("puppeteer");
const logger = require("../logger/logger");

async function getPuppeteer() {
  try {
    const puppeteerBrowser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 600000,
    });

    return puppeteerBrowser;
  } catch (error) {
    logger.error("puppeteer browser cannot be launched");
  }
}

module.exports = {
  getPuppeteer,
};
