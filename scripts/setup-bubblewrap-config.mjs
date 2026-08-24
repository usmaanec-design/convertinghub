import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const bubblewrapDir = path.join(os.homedir(), '.bubblewrap');
const configFile = path.join(bubblewrapDir, 'config.json');

const config = {
  jdkPath: 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.8-hotspot',
  androidSdkPath: 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk'
};

if (!existsSync(bubblewrapDir)) {
  mkdirSync(bubblewrapDir, { recursive: true });
}

writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
console.log('✅ Created Bubblewrap config at:', configFile);
console.log(JSON.stringify(config, null, 2));
