const auth = require('../../lib/auth');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth.sameOrigin(req)) return res.status(403).json({ error: 'Cross-origin request blocked' });
  if (!auth.configured()) return res.status(500).json({ error: 'ADMIN_PASSWORD is not set. Add it in Vercel > Settings > Environment Variables and redeploy.' });
  if (auth.throttled(req)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  if (!auth.passwordOk(req.body && req.body.password)) {
    auth.recordFail(req);
    await new Promise(r => setTimeout(r, 700));
    return res.status(401).json({ error: 'Incorrect password' });
  }
  auth.clearFails(req);
  auth.setSession(res, auth.issueToken(), auth.SESSION_MS);
  res.status(200).json({ ok: true });
};
