const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const assets = path.join(root, "assets");

const url = process.env.SECUREVOTE_URL || "http://127.0.0.1:5011";
const capturePath = process.env.SECUREVOTE_CAPTURE_PATH || "/elections";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });

  await page.goto(`${url}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "Admin@123456!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|verify-mfa/, { timeout: 30000 });

  if (page.url().includes("verify-mfa")) {
    throw new Error("SecureVote MFA is enabled; disable MFA for screenshot capture.");
  }

  await page.goto(`${url}${capturePath}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator("body").waitFor({ timeout: 30000 });
  await page.screenshot({
    path: path.join(assets, "screenshot-securevote.png"),
    fullPage: false,
  });
  console.log(`screenshot-securevote.png: ${url}${capturePath}`);

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
