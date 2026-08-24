import { execSync } from 'node:child_process';
import path from 'node:path';

const JAVA_HOME = 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.8-hotspot';
const ANDROID_HOME = 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk';
const SDKMANAGER = path.join(ANDROID_HOME, 'cmdline-tools', 'latest', 'bin', 'sdkmanager.bat');

const env = {
  ...process.env,
  JAVA_HOME,
  ANDROID_HOME,
  PATH: `${path.join(JAVA_HOME, 'bin')};${path.join(ANDROID_HOME, 'cmdline-tools', 'latest', 'bin')};${process.env.PATH}`
};

console.log('📜 [1/2] Accepting Android SDK Licenses...');
try {
  execSync(`cmd /c "echo y | ${SDKMANAGER} --licenses"`, { env, stdio: 'inherit' });
} catch (e) {
  // License prompt
}

console.log('\n📦 [2/2] Installing platforms;android-36, build-tools;36.0.0, platform-tools...');
execSync(`cmd /c "echo y | ${SDKMANAGER} \\"platforms;android-36\\" \\"build-tools;36.0.0\\" \\"platform-tools\\""`, { env, stdio: 'inherit' });

console.log('\n🎉 Android SDK packages installed successfully!');
