const { readContent } = require('../lib/store');
module.exports = async (req, res) => {
  try {
    const c = await readContent();
    // Browsers always revalidate (so edits show immediately); only Vercel's CDN may keep a copy, briefly.
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    res.status(200).json(c);
  } catch (e) { console.error('content read failed:', e); res.status(500).json({ error: 'Could not load content' }); }
};
