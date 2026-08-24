import { spawnSync } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const TWA_DIR = path.resolve('android-twa');
const JAVA_HOME = 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.8-hotspot';
const ANDROID_HOME = 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk';
const KEYSTORE_PASSWORD = process.env.KEYSTORE_PASSWORD || 'ConvertingHub2026SecureReleaseKeyPass!';

const env = {
  ...process.env,
  JAVA_HOME,
  ANDROID_HOME,
  PATH: `${path.join(JAVA_HOME, 'bin')};${path.join(ANDROID_HOME, 'cmdline-tools', 'latest', 'bin')};${path.join(ANDROID_HOME, 'platform-tools')};${process.env.PATH}`
};

console.log('🚀 [ConvertingHub TWA Android App Bundle Build]');
console.log('☕ JAVA_HOME:', JAVA_HOME);
console.log('📦 ANDROID_HOME:', ANDROID_HOME);
console.log('📂 Build Directory:', TWA_DIR);
console.log('🔑 Keystore Pass Loaded:', Boolean(KEYSTORE_PASSWORD));

console.log('\n🔨 Building Android App Bundle (.aab) & APK...');
const buildInputs = `n\n${KEYSTORE_PASSWORD}\n${KEYSTORE_PASSWORD}\n`;

const buildRes = spawnSync('npx', ['@bubblewrap/cli@1.25.0', 'build'], {
  cwd: TWA_DIR,
  env,
  input: buildInputs,
  encoding: 'utf-8',
  shell: true
});

console.log('STDOUT:\n', buildRes.stdout);
if (buildRes.stderr) console.error('STDERR:\n', buildRes.stderr);

console.log('\n🔍 Verifying generated build artifacts:');
function findArtifacts(dir) {
  if (!existsSync(dir)) return;
  const list = readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      findArtifacts(full);
    } else if (item.isFile() && (item.name.endsWith('.aab') || item.name.endsWith('.apk'))) {
      const s = statSync(full);
      console.log(`📦 FOUND ARTIFACT: ${item.name}`);
      console.log(`   Location: ${full}`);
      console.log(`   Size: ${s.size} bytes (${(s.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  }
}

findArtifacts(TWA_DIR);
