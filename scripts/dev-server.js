#!/usr/bin/env node
/* Static file server for local development.
 *
 * Replaces `python -m http.server`, which sends no Cache-Control header at all.
 * Browsers then apply a heuristic freshness lifetime and happily serve app.js
 * from cache after you have edited it — so you sit there testing a build from
 * ten minutes ago and wonder why your fix did nothing. That cost real debugging
 * time, so the fix lives in the repo rather than in someone's memory.
 *
 * Zero dependencies: Node's standard library only, same as the test runner.
 *
 *   node scripts/dev-server.js [port]
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2] || process.env.PORT || 3000);

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.md': 'text/markdown; charset=utf-8'
};

const server = http.createServer((req, res) => {
    // Strip the query string: cache-busting params must not become part of the path
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');

    // Resolve first, then check containment. Without this, a request for
    // /../../.env walks straight out of the project directory — and this server
    // runs on a machine that has real keys on it.
    const target = path.resolve(ROOT, relative);
    if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 — dizin dışına çıkılamaz');
        return;
    }

    fs.readFile(target, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 — bulunamadı: ' + relative);
            return;
        }

        res.writeHead(200, {
            'Content-Type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
            // The whole point of this file. no-store rather than no-cache: the
            // latter still permits a stored copy revalidated with a 304, and a
            // misbehaving intermediary can keep serving it.
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Aetheria.ai geliştirme sunucusu: http://localhost:${PORT}`);
    console.log('Önbellek kapalı — kaydettiğin her değişiklik yenilemede görünür.');
});
