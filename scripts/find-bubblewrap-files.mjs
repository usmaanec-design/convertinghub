import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else console.log(full);
  }
}

walk(path.resolve('node_modules/@bubblewrap'));
