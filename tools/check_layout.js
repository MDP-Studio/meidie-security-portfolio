const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 1300 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.resolve(__dirname, "../index.html").replace(/\\/g, "/")}`);
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflow: [...document.querySelectorAll("*")]
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return { tag: el.tagName, className: el.className, width: rect.width, left: rect.left, right: rect.right };
      })
      .filter((item) => item.right > window.innerWidth + 1 || item.left < -1)
      .slice(0, 20),
  }));
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
