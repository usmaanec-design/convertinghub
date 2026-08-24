import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Find bubblewrap in npx cache or node_modules
const npxCache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
console.log('Searching npx cache at:', npxCache);

let sdkConfigJs = null;
function findFile(dir, fileName) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFile(fullPath, fileName);
    } else if (entry.name === fileName) {
      console.log('Found:', fullPath);
      sdkConfigJs = fullPath;
    }
  }
}

findFile(npxCache, 'AndroidSdkConfig.js');

if (!sdkConfigJs) {
  findFile(path.join(process.env.APPDATA, 'npm'), 'AndroidSdkConfig.js');
}

if (sdkConfigJs) {
  const content = fs.readFileSync(sdkConfigJs, 'utf-8');
  console.log('\n--- AndroidSdkConfig.js Snippet ---');
  console.log(content.slice(0, 2000));
} else {
  console.log('AndroidSdkConfig.js not found in npx cache.');
}
