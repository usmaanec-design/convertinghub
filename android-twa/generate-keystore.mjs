import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const KEYSTORE_DIR = path.resolve('android-twa/keystore');
const KEYSTORE_PATH = path.join(KEYSTORE_DIR, 'convertinghub-release.keystore');
const ASSETLINKS_PATH = path.resolve('public/.well-known/assetlinks.json');

import { readFileSync } from 'node:fs';

// Load .env file if available
if (existsSync('.env')) {
  const envConfig = readFileSync('.env', 'utf-8');
  for (const line of envConfig.split('\n')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

const ALIAS = process.env.KEYSTORE_ALIAS || 'convertinghub';
const STOREPASS = process.env.KEYSTORE_PASSWORD;
const KEYPASS = process.env.KEYSTORE_PASSWORD;
const PACKAGE_NAME = 'app.web.convertinghub.official';

if (!STOREPASS) {
  console.error('❌ KEYSTORE_PASSWORD is not set in environment variables or .env file!');
  process.exit(1);
}

const KEYTOOL = 'C:\\Program Files\\ArcGIS\\Pro\\java\\runtime\\jre\\bin\\keytool.exe';

if (!existsSync(KEYSTORE_DIR)) {
  mkdirSync(KEYSTORE_DIR, { recursive: true });
}

console.log('🔐 [1/3] Checking Release Keystore...');

if (!existsSync(KEYSTORE_PATH)) {
  console.log('Generating new Android release keystore...');
  const genCmd = `& '${KEYTOOL}' -genkeypair -v -keystore '${KEYSTORE_PATH}' -alias ${ALIAS} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${STOREPASS} -keypass ${KEYPASS} -dname 'CN=ConvertingHub, OU=Mobile, O=ConvertingHub, L=Global, ST=Global, C=US'`;
  
  execSync(`powershell -ExecutionPolicy Bypass -Command "${genCmd}"`, { stdio: 'inherit' });
  console.log('✅ Keystore created successfully at:', KEYSTORE_PATH);
} else {
  console.log('ℹ️ Existing keystore found at:', KEYSTORE_PATH);
}

console.log('\n🔍 [2/3] Extracting SHA-256 Certificate Fingerprint...');

const listCmd = `& '${KEYTOOL}' -list -v -keystore '${KEYSTORE_PATH}' -alias ${ALIAS} -storepass ${STOREPASS}`;
const listOutput = execSync(`powershell -ExecutionPolicy Bypass -Command "${listCmd}"`, { encoding: 'utf-8' });

const sha256Match = listOutput.match(/SHA256:\s*([A-FA-f0-9:]+)/);

if (!sha256Match) {
  console.error('❌ Could not parse SHA256 fingerprint from keytool output!');
  console.log(listOutput);
  process.exit(1);
}

const sha256Fingerprint = sha256Match[1].toUpperCase();
console.log('✅ Extracted SHA-256 Fingerprint:', sha256Fingerprint);

console.log('\n📄 [3/3] Generating public/.well-known/assetlinks.json...');

const wellKnownDir = path.dirname(ASSETLINKS_PATH);
if (!existsSync(wellKnownDir)) {
  mkdirSync(wellKnownDir, { recursive: true });
}

const assetlinksContent = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: PACKAGE_NAME,
      sha256_cert_fingerprints: [
        sha256Fingerprint
      ]
    }
  }
];

writeFileSync(ASSETLINKS_PATH, JSON.stringify(assetlinksContent, null, 2), 'utf-8');
console.log('✅ assetlinks.json generated successfully at:', ASSETLINKS_PATH);
console.log('\n🎉 Keystore & Digital Asset Links setup complete!');
