const YouTubeScraper = require('../YouTubeScraper');
const scraper = new YouTubeScraper();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter diperlukan. Contoh: ?query=lagu',
      });
    }

    try {
      const result = await scraper.search(query);
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
