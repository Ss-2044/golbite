// Copies the static web app into www/ (Capacitor's webDir). No bundler needed.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
const out = 'www';
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const p of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets']) cpSync(p, `${out}/${p}`, { recursive: true });
console.log('Web app copied to www/');
