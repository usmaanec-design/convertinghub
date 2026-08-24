import { spawnSync } from 'node:child_process';
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

const yResponses = Array(30).fill('y').join('\n') + '\n';

console.log('📜 [1/2] Accepting all SDK Licenses...');
const licResult = spawnSync(SDKMANAGER, ['--licenses'], {
  env,
  input: yResponses,
  encoding: 'utf-8'
});
console.log(licResult.stdout);

console.log('\n📦 [2/2] Installing platforms;android-36, build-tools;36.0.0, platform-tools...');
const pkgResult = spawnSync(SDKMANAGER, ['platforms;android-36', 'build-tools;36.0.0', 'platform-tools'], {
  env,
  input: yResponses,
  encoding: 'utf-8'
});
console.log(pkgResult.stdout);
if (pkgResult.stderr) console.error(pkgResult.stderr);

console.log('\n🎉 Android SDK setup complete!');
