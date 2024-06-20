const chromium = require('chrome-aws-lambda');

(async () => {
  try {
    const executablePath = await chromium.executablePath;
    if (!executablePath) {
      throw new Error('Chromium executable path not found');
    }
    console.log('Chromium installed successfully');
    process.exit(0);  // Exit the process successfully
  } catch (error) {
    console.error('Failed to install Chromium:', error);
    process.exit(1);  // Exit the process with an error
  }
})();
