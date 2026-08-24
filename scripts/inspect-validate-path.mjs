import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('node_modules/@bubblewrap/core/dist/lib/androidSdk/AndroidSdkTools.js');
const txt = fs.readFileSync(file, 'utf-8');

const lines = txt.split('\n');
let print = false;
lines.forEach((line, idx) => {
  if (line.includes('validatePath')) print = true;
  if (print) {
    console.log(`L${idx + 1}: ${line}`);
    if (line.includes('}')) print = false; // print snippet around validatePath
  }
});
