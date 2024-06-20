const chromium = require('chrome-aws-lambda');

(async () => {
  try {
    await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');
    console.log('Chromium setup completed');
  } catch (error) {
    console.error('Failed to set up Chromium:', error);
  }
})();
