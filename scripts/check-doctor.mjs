import { execSync } from 'node:child_process';
import path from 'node:path';

const JAVA_HOME = 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.8-hotspot';
const ANDROID_HOME = 'C:\\Users\\usmaa\\AppData\\Local\\Android\\Sdk';

const env = {
  ...process.env,
  JAVA_HOME,
  ANDROID_HOME,
  PATH: `${path.join(JAVA_HOME, 'bin')};${path.join(ANDROID_HOME, 'cmdline-tools', 'latest', 'bin')};${path.join(ANDROID_HOME, 'platform-tools')};${process.env.PATH}`
};

console.log('🩺 Running Bubblewrap Doctor...\n');
try {
  const output = execSync('npx --yes @bubblewrap/cli@1.25.0 doctor', { env, encoding: 'utf-8', stdio: 'pipe' });
  console.log(output);
} catch (e) {
  console.log('Output stdout:\n', e.stdout);
  console.log('Output stderr:\n', e.stderr);
}
