// Local development server (no Vercel account needed): node dev.js  ->  http://localhost:3000
// Content is saved to ./.data/content.json when no Blob token is configured.
const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({ limit: '300kb' }));
const mount = (route, file) => app.all(route, (req, res) => require(file)(req, res));
mount('/api/content', './api/content');
mount('/api/admin/session', './api/admin/session');
mount('/api/admin/login', './api/admin/login');
mount('/api/admin/logout', './api/admin/logout');
mount('/api/admin/content', './api/admin/content');
app.use(express.static(path.join(__dirname, 'public')));
module.exports = app;
if (require.main === module) {
  if (!process.env.ADMIN_PASSWORD) console.log('Tip: set ADMIN_PASSWORD to enable the admin login, e.g. ADMIN_PASSWORD=secret123 npm run dev');
  app.listen(process.env.PORT || 3000, () => console.log('Dev server: http://localhost:' + (process.env.PORT || 3000) + '  (admin: /#admin)'));
}
