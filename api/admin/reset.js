const auth = require('../../lib/auth');
const defaults = require('../../lib/defaults');
const { readContent, writeContent } = require('../../lib/store');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth.isAdmin(req)) return res.status(401).json({ error: 'Not signed in' });
  if (!auth.sameOrigin(req)) return res.status(403).json({ error: 'Cross-origin request blocked' });
  try { await writeContent(defaults); res.status(200).json(await readContent()); }
  catch (e) { console.error('reset failed:', e); res.status(500).json({ error: 'Could not reset: ' + String((e && e.message) || e).slice(0, 300) }); }
};
