const chromium = require('chrome-aws-lambda');

(async () => {
  try {
    const executablePath = await chromium.executablePath;
    if (!executablePath) {
      throw new Error('Chromium executable path not found');
    }
    console.log('Chromium installed successfully');
  } catch (error) {
    console.error('Failed to install Chromium:', error);
    process.exit(1);  // Ensure the process exits on error
  }
})();
