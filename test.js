// Smoke tests: npm test   (no Vercel account needed)
const os = require('os'), path = require('path'), assert = require('assert'), Module = require('module');
process.env.ADMIN_PASSWORD = 'test-password-123';

async function suite(label, setup) {
  const cleanup = setup && setup();
  // fresh module instances so store.js re-reads env
  Object.keys(require.cache).forEach(k => { if (!k.includes('node_modules')) delete require.cache[k]; });
  const app = require('./dev');
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  let cookie = '';
  const call = async (p, method = 'GET', body, headers = {}) => {
    const r = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json', cookie, ...headers }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    return { status: r.status, json: await r.json().catch(() => null) };
  };
  let r = await call('/api/content'); assert.equal(r.status, 200); assert(r.json.times.length >= 1, 'defaults served');
  assert.equal((await call('/api/admin/session')).json.authed, false);
  r = await call('/api/admin/content'); assert.equal(r.status, 401, 'admin read needs login');
  r = await call('/api/admin/content', 'PUT', r.json || {}); assert.equal(r.status, 401, 'write needs login');
  r = await call('/api/admin/login', 'POST', { password: 'wrong' }); assert.equal(r.status, 401);
  r = await call('/api/admin/login', 'POST', { password: 'test-password-123' }, { Origin: 'http://evil.example' }); assert.equal(r.status, 403, 'cross-origin blocked');
  r = await call('/api/admin/login', 'POST', { password: 'test-password-123' }); assert.equal(r.status, 200);
  assert.equal((await call('/api/admin/session')).json.authed, true);
  const c = (await call('/api/admin/content')).json;
  c.welcome = 'Hello test'; c.verseText = 'Test verse'; c.verseRef = 'John 1:1'; c.events.push({ title: 'T', date: '2027-01-01', tag: 'x', desc: 'y' });
  r = await call('/api/admin/content', 'PUT', c); assert.equal(r.status, 200); assert.equal(r.json.verseText, 'Test verse');
  r = await call('/api/content'); assert.equal(r.json.welcome, 'Hello test'); assert.equal(r.json.events.length, c.events.length);
  c.stream = 'javascript:alert(1)'; r = await call('/api/admin/content', 'PUT', c); assert.equal(r.status, 400, 'bad URL rejected');
  // forged / tampered cookie
  const good = cookie; cookie = 'sid=' + good.slice(4, -3) + 'abc';
  assert.equal((await call('/api/admin/session')).json.authed, false, 'tampered cookie rejected');
  cookie = good;
  await call('/api/admin/logout', 'POST'); cookie = '';
  assert.equal((await call('/api/admin/session')).json.authed, false);
  server.close(); cleanup && cleanup();
  console.log('PASS:', label);
}

(async () => {
  try {
    // 1) local file store
    await suite('local file store', () => { delete process.env.BLOB_READ_WRITE_TOKEN; process.env.DATA_FILE = path.join(os.tmpdir(), `church-${Date.now()}.json`); });

    // 2) fake @vercel/blob (in memory) incl. private-store-with-public-default fallback
    await suite('blob store (mocked, store is PUBLIC but default tries private first)', () => {
      const mem = new Map(); const calls = [];
      const fake = {
        get: async (key, o) => { calls.push(['get', o.access]); if (o.access !== 'public') throw new Error('store is public'); const v = mem.get(key); return v ? { statusCode: 200, stream: new Response(v).body } : null; },
        put: async (key, body, o) => { calls.push(['put', o.access]); if (o.access !== 'public') throw new Error('store is public'); assert(o.allowOverwrite && o.addRandomSuffix === false); mem.set(key, body); return { url: 'x' }; }
      };
      const orig = Module._load;
      Module._load = function (req, ...a) { return req === '@vercel/blob' ? fake : orig.call(this, req, ...a); };
      process.env.BLOB_READ_WRITE_TOKEN = 'fake-token';
      return () => { Module._load = orig; delete process.env.BLOB_READ_WRITE_TOKEN; };
    });
    console.log('All tests passed');
  } catch (e) { console.error('FAILED:', e.stack || e.message); process.exitCode = 1; }
})();
