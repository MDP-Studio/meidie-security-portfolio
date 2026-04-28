const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const assets = path.join(root, "assets");

const pages = [
  {
    name: "screenshot-phishanalyze.png",
    url: "https://phishanalyze.mdpstudio.com.au/",
  },
  {
    name: "screenshot-cryptotoolkit.png",
    url: "https://ctool.mdpstudio.com.au",
  },
  {
    name: "screenshot-command-center.png",
    url: "https://c3.mdpstudio.com.au",
  },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });

  for (const item of pages) {
    await page.goto(item.url, { waitUntil: "networkidle", timeout: 60000 });
    await page.screenshot({
      path: path.join(assets, item.name),
      fullPage: false,
    });
    console.log(`${item.name}: ${item.url}`);
  }

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
