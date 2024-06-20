const chromium = require('chrome-aws-lambda');

async function installChromium() {
  await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  console.log('Chromium installed successfully!');
  await browser.close();
}

installChromium().catch(error => {
  console.error('Failed to install Chromium:', error);
});
