const chromium = require('chrome-aws-lambda');

(async () => {
  try {
    await chromium.executablePath;
    console.log('Chromium installed successfully');
  } catch (error) {
    console.error('Failed to install Chromium:', error);
  }
})();
