import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import fs from 'node:fs';

const JAVA_HOME = 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.8-hotspot';
const ANDROID_HOME = 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk';
const CMDLINE_TOOLS_ZIP_URL = 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip';
const ZIP_PATH = 'C:\\Users\\usmaa\\AppData\\Local\\Temp\\cmdline-tools.zip';
const EXTRACT_DIR = 'C:\\Users\\usmaa\\AppData\Local\\Temp\\cmdline-extract';
const FINAL_CMDLINE_DIR = path.join(ANDROID_HOME, 'cmdline-tools', 'latest');

process.env.JAVA_HOME = JAVA_HOME;
process.env.ANDROID_HOME = ANDROID_HOME;
process.env.PATH = `${path.join(JAVA_HOME, 'bin')};${path.join(FINAL_CMDLINE_DIR, 'bin')};${process.env.PATH}`;

console.log('🤖 [Android SDK & JDK Setup]');
console.log('☕ JAVA_HOME:', JAVA_HOME);
console.log('📦 ANDROID_HOME:', ANDROID_HOME);

if (!existsSync(path.join(FINAL_CMDLINE_DIR, 'bin', 'sdkmanager.bat'))) {
  console.log('\n⬇️ Downloading Android SDK Command-line Tools...');
  
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(ZIP_PATH);
    https.get(CMDLINE_TOOLS_ZIP_URL, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      if (existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
      reject(err);
    });
  });

  console.log('✅ Download complete. Extracting tar/zip...');
  
  if (existsSync(EXTRACT_DIR)) {
    rmSync(EXTRACT_DIR, { recursive: true, force: true });
  }
  
  // Use tar.exe which handles long paths natively on Windows 10/11
  mkdirSync(EXTRACT_DIR, { recursive: true });
  execSync(`tar -xf "${ZIP_PATH}" -C "${EXTRACT_DIR}"`, { stdio: 'inherit' });

  mkdirSync(FINAL_CMDLINE_DIR, { recursive: true });
  
  const extractedRoot = path.join(EXTRACT_DIR, 'cmdline-tools');
  execSync(`powershell -ExecutionPolicy Bypass -Command "Copy-Item -Path '${extractedRoot}\\*' -Destination '${FINAL_CMDLINE_DIR}' -Recurse -Force"`, { stdio: 'inherit' });
  
  if (existsSync(ZIP_PATH)) rmSync(ZIP_PATH, { force: true });
  if (existsSync(EXTRACT_DIR)) rmSync(EXTRACT_DIR, { recursive: true, force: true });
  
  console.log('✅ Android SDK Command-line Tools installed to:', FINAL_CMDLINE_DIR);
} else {
  console.log('✅ Android SDK Command-line Tools already present at:', FINAL_CMDLINE_DIR);
}

const SDKMANAGER = path.join(FINAL_CMDLINE_DIR, 'bin', 'sdkmanager.bat');

console.log('\n📜 Accepting Android SDK Licenses...');
try {
  execSync(`cmd /c "echo y | \\"${SDKMANAGER}\\" --licenses"`, {
    env: { ...process.env, JAVA_HOME, ANDROID_HOME },
    stdio: 'inherit'
  });
} catch (e) {
  // license accept
}

console.log('\n📦 Installing Android SDK Packages: platforms;android-36, build-tools;36.0.0, platform-tools...');
execSync(`cmd /c "echo y | \\"${SDKMANAGER}\\" \\"platforms;android-36\\" \\"build-tools;36.0.0\\" \\"platform-tools\\""`, {
  env: { ...process.env, JAVA_HOME, ANDROID_HOME },
  stdio: 'inherit'
});

console.log('\n🎉 Android SDK & JDK 17 setup complete!');
