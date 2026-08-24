import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('node_modules/@bubblewrap/core/dist/lib/androidSdk/AndroidSdkConfig.js');
console.log('File path:', file);
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf-8');
  console.log(content);
} else {
  console.log('File not found. Searching node_modules/@bubblewrap/core...');
}
