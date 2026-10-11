const { readContent } = require('../lib/store');
module.exports = async (req, res) => {
  try {
    const c = await readContent();
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=20, stale-while-revalidate=60');
    res.status(200).json(c);
  } catch (e) { console.error('content read failed:', e); res.status(500).json({ error: 'Could not load content' }); }
};
