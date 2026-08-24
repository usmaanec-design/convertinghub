import path from 'node:path';
import fs from 'node:fs';

const androidSdkPath = 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk';

console.log('Inspecting Android SDK Directory:', androidSdkPath);
console.log('Directory exists:', fs.existsSync(androidSdkPath));

if (fs.existsSync(androidSdkPath)) {
  const contents = fs.readdirSync(androidSdkPath);
  console.log('Root contents:', contents);
  
  const buildToolsPath = path.join(androidSdkPath, 'build-tools');
  if (fs.existsSync(buildToolsPath)) {
    console.log('build-tools contents:', fs.readdirSync(buildToolsPath));
  }
}

// Check bubblewrap package in global / npx cache
const userHome = process.env.USERPROFILE || 'C:\\Users\\usmaa';
const cacheDir = path.join(userHome, 'AppData', 'Local', 'npm-cache', '_npx');

console.log('Searching for bubblewrap core files in temp/cache...');
function searchForFile(dir, pattern) {
  if (!fs.existsSync(dir)) return;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        searchForFile(full, pattern);
      } else if (f.includes(pattern)) {
        console.log('Found:', full);
      }
    }
  } catch (e) {}
}

searchForFile(cacheDir, 'AndroidSdkConfig');
