import { execSync } from 'node:child_process';
import path from 'node:path';

const JAVA_HOME = 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.8-hotspot';
const ANDROID_HOME = 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk';

const env = {
  ...process.env,
  JAVA_HOME,
  ANDROID_HOME
};

// Also install build-tools;34.0.0 and 33.0.2 just in case Bubblewrap looks for specific build-tools
const SDKMANAGER = path.join(ANDROID_HOME, 'cmdline-tools', 'latest', 'bin', 'sdkmanager.bat');
console.log('📦 Installing build-tools;34.0.0 & build-tools;33.0.2...');
try {
  execSync(`powershell -ExecutionPolicy Bypass -Command "$env:JAVA_HOME='${JAVA_HOME}'; (1..5 | %{'y'}) | & '${SDKMANAGER}' 'build-tools;34.0.0' 'build-tools;33.0.2'"`, { stdio: 'inherit' });
} catch (e) {
  //
}

console.log('\n🩺 Re-testing Bubblewrap Doctor...');
try {
  const res = execSync('npx --yes @bubblewrap/cli@1.25.0 doctor', { env, encoding: 'utf-8' });
  console.log(res);
} catch (e) {
  console.log('STDOUT:\n', e.stdout);
  console.log('STDERR:\n', e.stderr);
}
