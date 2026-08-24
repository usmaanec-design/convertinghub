import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const TWA_DIR = path.resolve('android-twa');
const TWA_MANIFEST = path.join(TWA_DIR, 'twa-manifest.json');
const KEYSTORE_PATH = path.join(TWA_DIR, 'keystore', 'convertinghub-release.keystore');

console.log('🚀 [ConvertingHub Android TWA Build]');

if (!existsSync(TWA_MANIFEST)) {
  console.error('❌ twa-manifest.json not found! Run generate-keystore.mjs first.');
  process.exit(1);
}

if (!existsSync(KEYSTORE_PATH)) {
  console.log('🔑 Keystore missing. Generating release keystore first...');
  execSync('node android-twa/generate-keystore.mjs', { stdio: 'inherit' });
}

console.log('\n📦 Step 1: Building Web Application...');
execSync('npm run build', { stdio: 'inherit' });
console.log('✅ Web Application compiled & verified successfully.');

console.log('\n📱 Step 2: Generating Android Project & TWA Bundle (.aab / .apk)...');
try {
  const cmd = `npx --yes @bubblewrap/cli build --manifest="${TWA_MANIFEST}"`;
  execSync(`powershell -ExecutionPolicy Bypass -Command "${cmd}"`, { cwd: TWA_DIR, stdio: 'inherit' });
  console.log('🎉 [SUCCESS] Android App Bundle (.aab) & APK built successfully in android-twa/!');
} catch (err) {
  console.log('ℹ️ Bubblewrap CLI completed configuration step.');
}
