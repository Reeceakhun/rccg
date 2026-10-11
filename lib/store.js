// Content storage.
//  - On Vercel (a Blob store is connected): one JSON file in Vercel Blob.
//  - Locally (no token): a JSON file in ./.data so you can develop without Vercel.
const fs = require('fs');
const path = require('path');
const defaults = require('./defaults');

const KEY = 'church/content.json';
const LOCAL = process.env.DATA_FILE || path.join(process.cwd(), '.data', 'content.json');
// Vercel adds either BLOB_READ_WRITE_TOKEN (older stores) or BLOB_STORE_ID (newer stores, which
// authenticate automatically with Vercel's built-in token). Either one means Blob is connected.
const useBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

// New Blob stores can be private or public. We default to private and quietly fall back
// to the other mode if the store you created is the other kind.
let access = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
const other = (a) => (a === 'private' ? 'public' : 'private');

const merge = (c) => ({ ...defaults, ...(c || {}), social: { ...defaults.social, ...((c && c.social) || {}) } });

async function readContent() {
  if (!useBlob()) {
    try { return merge(JSON.parse(fs.readFileSync(LOCAL, 'utf8'))); } catch { return merge({}); }
  }
  const blob = require('@vercel/blob');
  let lastErr, sawEmpty = false;
  for (const a of [access, other(access)]) {
    try {
      const r = await blob.get(KEY, { access: a, useCache: false });
      if (r && r.statusCode === 200) { access = a; return merge(await new Response(r.stream).json()); }
      sawEmpty = true; // reached the store but nothing saved yet
    } catch (e) { lastErr = e; }
  }
  if (sawEmpty) return merge({}); // first run: show starter content
  throw lastErr || new Error('Could not read content');
}

async function writeContent(c) {
  const body = JSON.stringify(c);
  if (!useBlob()) {
    fs.mkdirSync(path.dirname(LOCAL), { recursive: true });
    fs.writeFileSync(LOCAL, body);
    return;
  }
  const blob = require('@vercel/blob');
  let lastErr;
  for (const a of [access, other(access)]) {
    try {
      await blob.put(KEY, body, { access: a, contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
      access = a; return;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

module.exports = { readContent, writeContent };
