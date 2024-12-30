const YouTubeScraper = require('../YouTubeScraper');
const scraper = new YouTubeScraper();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { url, type = 'video', quality = '720p' } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL parameter diperlukan. Contoh: ?url=https://youtube.com/watch?v=ID_VIDEO',
      });
    }

    try {
      const result = await scraper.download(url, { type, quality });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
