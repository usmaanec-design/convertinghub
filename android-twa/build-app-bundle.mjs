import { execSync } from 'node:child_process';
import { existsSync, copyFileSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const TWA_DIR = path.resolve('android-twa');
const JAVA_HOME = 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.8-hotspot';
const ANDROID_HOME = 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk';

const env = {
  ...process.env,
  JAVA_HOME,
  ANDROID_HOME,
  PATH: `${path.join(JAVA_HOME, 'bin')};${path.join(ANDROID_HOME, 'cmdline-tools', 'latest', 'bin')};${path.join(ANDROID_HOME, 'platform-tools')};${process.env.PATH}`
};

console.log('🚀 [ConvertingHub Android App Bundle (.aab) Direct Build]');
console.log('☕ JAVA_HOME:', JAVA_HOME);
console.log('📦 ANDROID_HOME:', ANDROID_HOME);
console.log('📂 Build Directory:', TWA_DIR);

console.log('\n🔨 Step 1: Running Gradle bundleRelease and assembleRelease...');
execSync(`cmd /c "gradlew.bat bundleRelease assembleRelease"`, {
  cwd: TWA_DIR,
  env,
  stdio: 'inherit'
});

console.log('\n✅ Step 2: Locating and copying build output artifacts...');
const bundleSource = path.join(TWA_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const apkSource = path.join(TWA_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

const bundleDest = path.join(TWA_DIR, 'app-release-bundle.aab');
const apkDest = path.join(TWA_DIR, 'app-release-signed.apk');

if (existsSync(bundleSource)) {
  copyFileSync(bundleSource, bundleDest);
  const s = statSync(bundleDest);
  console.log(`🎉 SUCCESS! Android App Bundle (.aab) generated and saved to:`);
  console.log(`   File Path: ${bundleDest}`);
  console.log(`   Size: ${s.size} bytes (${(s.size / (1024 * 1024)).toFixed(2)} MB)`);
} else {
  console.error(`❌ Bundle source not found at: ${bundleSource}`);
}

if (existsSync(apkSource)) {
  copyFileSync(apkSource, apkDest);
  const s = statSync(apkDest);
  console.log(`🎉 SUCCESS! Release Signed APK generated and saved to:`);
  console.log(`   File Path: ${apkDest}`);
  console.log(`   Size: ${s.size} bytes (${(s.size / (1024 * 1024)).toFixed(2)} MB)`);
} else {
  console.error(`❌ APK source not found at: ${apkSource}`);
}
