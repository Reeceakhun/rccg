// Stateless admin auth: the password lives in the ADMIN_PASSWORD environment variable,
// and a login issues a signed, expiring cookie (no database needed).
const crypto = require('crypto');
const SESSION_MS = 12 * 60 * 60 * 1000;

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const secret = () => process.env.SESSION_SECRET || sha('rccg-session:' + (process.env.ADMIN_PASSWORD || '')).toString('hex');
const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');
const configured = () => !!process.env.ADMIN_PASSWORD;

function passwordOk(pw) {
  if (!configured() || typeof pw !== 'string' || !pw) return false;
  return crypto.timingSafeEqual(sha(pw), sha(process.env.ADMIN_PASSWORD));
}
function issueToken() { const v = String(Date.now() + SESSION_MS); return v + '.' + sign(v); }
function tokenOk(tok) {
  if (!configured() || !tok) return false;
  const [v, sig] = String(tok).split('.');
  if (!v || !sig) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(v));
  return a.length === b.length && crypto.timingSafeEqual(a, b) && Number(v) > Date.now();
}
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
const isAdmin = (req) => tokenOk(cookies(req).sid);
function setSession(res, token, maxAgeMs) {
  const secure = process.env.VERCEL || process.env.COOKIE_SECURE === '1' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`);
}
// Block cross-site writes (defence in depth on top of SameSite=Strict).
function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}
// Best-effort throttle (per serverless instance) + a delay on failures.
const fails = new Map();
const ipOf = (req) => String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'x').split(',')[0].trim();
const throttled = (req) => { const f = fails.get(ipOf(req)); return !!f && f.reset > Date.now() && f.n >= 8; };
const recordFail = (req) => { const k = ipOf(req), f = fails.get(k); if (!f || f.reset < Date.now()) fails.set(k, { n: 1, reset: Date.now() + 15 * 60 * 1000 }); else f.n++; };
const clearFails = (req) => fails.delete(ipOf(req));

module.exports = { SESSION_MS, configured, passwordOk, issueToken, isAdmin, setSession, sameOrigin, throttled, recordFail, clearFails };
