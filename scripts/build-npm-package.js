import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const drawioDist = path.join(dist, 'drawio');

const runtimeEntries = [
  'clear.html',
  'connect',
  'export3.html',
  'favicon.ico',
  'gitlab.html',
  'github.html',
  'images',
  'img',
  'index.html',
  'js',
  'math4',
  'mxgraph',
  'onedrive3.html',
  'open.html',
  'plugins',
  'resources',
  'service-worker.js',
  'shapes',
  'stencils',
  'styles',
  'teams.html',
  'templates',
  'vsdxImporter.html',
  'workbox-acfd85e3.js'
];

const packageEntries = [
  ['package-src/core', 'core'],
  ['package-src/react', 'react'],
  ['package-src/vue', 'vue']
];

function copyIfExists(sourceRelative, targetDirectory) {
  const source = path.join(root, sourceRelative);

  if (!fs.existsSync(source)) {
    return;
  }

  const target = path.join(targetDirectory, path.basename(sourceRelative));
  fs.cpSync(source, target, {
    recursive: true,
    dereference: true,
    filter(file) {
      const base = path.basename(file);
      return base !== '.git' && base !== 'node_modules' && base !== 'dist';
    }
  });
}

function copyDirectory(sourceRelative, targetRelative) {
  const source = path.join(root, sourceRelative);
  const target = path.join(dist, targetRelative);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing package source: ${sourceRelative}`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, dereference: true });
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(drawioDist, { recursive: true });

for (const entry of runtimeEntries) {
  copyIfExists(entry, drawioDist);
}

for (const [source, target] of packageEntries) {
  copyDirectory(source, target);
}

fs.writeFileSync(
  path.join(dist, 'index.js'),
  "export * from './core/index.js';\n",
  'utf8'
);

fs.writeFileSync(
  path.join(dist, 'index.d.ts'),
  "export * from './core/index.js';\n",
  'utf8'
);

console.log('NPM package bundle written to dist/.');
