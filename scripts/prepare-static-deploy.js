const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');
const checkOnly = process.argv.includes('--check');

const requiredPaths = [
  'index.html',
  'js/bootstrap.js',
  'js/main.js',
  'js/embed-api.js',
  'js/app.min.js',
  'styles/grapheditor.css',
  'resources/dia_zh.txt',
  'service-worker.js',
  'workbox-acfd85e3.js',
  'favicon.ico'
];

const excluded = new Set([
  '.git',
  '.gitignore',
  '.vercel',
  '.wrangler',
  'DEPLOYMENT.md',
  'dist',
  'docs',
  'META-INF',
  'node_modules',
  'package-lock.json',
  'package.json',
  'scripts',
  'test',
  'vercel.json',
  'WEB-INF',
  'wrangler.toml'
]);

function assertRequiredFiles() {
  const missing = requiredPaths.filter((rel) => !fs.existsSync(path.join(root, rel)));

  if (missing.length > 0) {
    console.error('Missing required deployment files:');
    missing.forEach((rel) => console.error(`- ${rel}`));
    process.exit(1);
  }
}

function copyEntry(entry) {
  if (excluded.has(entry)) {
    return;
  }

  const src = path.join(root, entry);
  const dest = path.join(dist, entry);
  fs.cpSync(src, dest, {
    recursive: true,
    dereference: true,
    filter: (file) => {
      const base = path.basename(file);
      return !excluded.has(base);
    }
  });
}

assertRequiredFiles();

if (checkOnly) {
  console.log('Static deployment check passed.');
  process.exit(0);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(root)) {
  copyEntry(entry);
}

console.log('Static deployment bundle written to dist/.');
