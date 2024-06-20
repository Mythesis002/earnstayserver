const chromium = require('chrome-aws-lambda');

(async () => {
  try {
    await chromium.executablePath;
    console.log('Chromium installed successfully');
  } catch (error) {
    console.error('Failed to install Chromium:', error);
    process.exit(1);  // Ensure the process exits on error
  }
})();
