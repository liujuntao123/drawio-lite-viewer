const fs = require('fs');
const http = require('http');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.vsdx': 'application/octet-stream',
  '.xml': 'application/xml; charset=utf-8'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function resolveFile(url) {
  const cleanPath = decodeURIComponent(url.split('?')[0]).replace(/^\/+/, '');
  const requested = path.resolve(dist, cleanPath || 'index.html');

  if (!requested.startsWith(dist + path.sep) && requested !== dist) {
    return null;
  }

  return requested;
}

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html not found. Run npm run build first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || '/');

  if (file == null) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(file, (statErr, stat) => {
    const target = !statErr && stat.isDirectory() ? path.join(file, 'index.html') : file;

    fs.readFile(target, (readErr, content) => {
      if (readErr) {
        send(res, 404, 'Not found');
        return;
      }

      const type = types[path.extname(target).toLowerCase()] || 'application/octet-stream';
      send(res, 200, content, type);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Serving dist at http://localhost:${port}/`);
});
