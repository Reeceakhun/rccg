const auth = require('../../lib/auth');
module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth.sameOrigin(req)) return res.status(403).json({ error: 'Cross-origin request blocked' });
  auth.setSession(res, '', 0);
  res.status(200).json({ ok: true });
};
