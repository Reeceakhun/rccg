const auth = require('../../lib/auth');
module.exports = (req, res) => { res.setHeader('Cache-Control', 'no-store'); res.status(200).json({ authed: auth.isAdmin(req), configured: auth.configured() }); };
