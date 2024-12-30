const path = require('path');

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.sendFile(path.join(process.cwd(), 'index.html'));
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
