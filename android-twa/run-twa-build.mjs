import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const TWA_DIR = path.resolve('android-twa');
const JAVA_HOME = 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.8-hotspot';
const ANDROID_HOME = 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk';

const env = {
  ...process.env,
  JAVA_HOME,
  ANDROID_HOME,
  PATH: `${path.join(JAVA_HOME, 'bin')};${path.join(ANDROID_HOME, 'cmdline-tools', 'latest', 'bin')};${path.join(ANDROID_HOME, 'platform-tools')};${process.env.PATH}`
};

console.log('🚀 [ConvertingHub TWA Android App Build]');
console.log('☕ JAVA_HOME:', JAVA_HOME);
console.log('📦 ANDROID_HOME:', ANDROID_HOME);
console.log('📂 Build Directory:', TWA_DIR);

try {
  console.log('\n🔨 Running Bubblewrap build...');
  execSync('npx --yes @bubblewrap/cli@1.25.0 build', {
    cwd: TWA_DIR,
    env,
    stdio: 'inherit'
  });
  console.log('\n🎉 Bubblewrap build command finished successfully!');
} catch (e) {
  console.error('\n❌ Build output error:', e.message);
}

// Search for generated .aab and .apk files in android-twa
const targetFiles = ['app-release-bundle.aab', 'app-release-signed.apk', 'app-release.apk', 'app-release.aab'];
console.log('\n🔍 Verifying generated files:');
targetFiles.forEach(f => {
  const p = path.join(TWA_DIR, f);
  if (existsSync(p)) {
    const s = statSync(p);
    console.log(`✅ FOUND: ${f}`);
    console.log(`   Full Path: ${p}`);
    console.log(`   Size: ${s.size} bytes (${(s.size / (1024 * 1024)).toFixed(2)} MB)`);
  }
});
