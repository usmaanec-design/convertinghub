import { symlinkSync, existsSync } from 'node:fs';
import path from 'node:path';

const sdkDir = 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk';
const binTarget = path.join(sdkDir, 'cmdline-tools', 'latest', 'bin');
const toolsTarget = path.join(sdkDir, 'cmdline-tools', 'latest');

const binPath = path.join(sdkDir, 'bin');
const toolsPath = path.join(sdkDir, 'tools');

console.log('🔗 Creating SDK junctions for Bubblewrap compatibility...');

if (!existsSync(binPath)) {
  symlinkSync(binTarget, binPath, 'junction');
  console.log('✅ Created junction:', binPath, '->', binTarget);
} else {
  console.log('ℹ️ Path already exists:', binPath);
}

if (!existsSync(toolsPath)) {
  symlinkSync(toolsTarget, toolsPath, 'junction');
  console.log('✅ Created junction:', toolsPath, '->', toolsTarget);
} else {
  console.log('ℹ️ Path already exists:', toolsPath);
}
