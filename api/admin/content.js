const auth = require('../../lib/auth');
const { readContent, writeContent } = require('../../lib/store');
const { sanitize, Bad } = require('../../lib/validate');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!auth.isAdmin(req)) return res.status(401).json({ error: 'Not signed in' });
  try {
    if (req.method === 'GET') return res.status(200).json(await readContent());
    if (req.method === 'PUT') {
      if (!auth.sameOrigin(req)) return res.status(403).json({ error: 'Cross-origin request blocked' });
      await writeContent(sanitize(req.body));
      return res.status(200).json(await readContent());
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    if (e instanceof Bad) return res.status(400).json({ error: e.message });
    console.error('admin content failed:', e);
    // Only signed-in admins reach this point, so showing the real reason is safe and makes problems easy to diagnose.
    res.status(500).json({ error: 'Could not save: ' + String((e && e.message) || e).slice(0, 300) });
  }
};
