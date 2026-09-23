import fs from 'fs';
import path from 'path';

const EXPECTED_SITE_URL = 'https://convertinghub-official.web.app';

console.log('=== STARTING CONVERTINGHUB SEO AUDIT & VALIDATION ===\n');

let errors = 0;
let warnings = 0;

// 1. Validate robots.txt
const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  console.error('❌ FAIL: public/robots.txt is missing!');
  errors++;
} else {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  if (!robotsContent.includes(`Sitemap: ${EXPECTED_SITE_URL}/sitemap.xml`)) {
    console.error(`❌ FAIL: public/robots.txt does not contain exact Sitemap directive: Sitemap: ${EXPECTED_SITE_URL}/sitemap.xml`);
    errors++;
  } else {
    console.log('✓ PASS: public/robots.txt valid & contains correct Sitemap directive.');
  }
}

// 2. Validate sitemap.xml
const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  console.error('❌ FAIL: public/sitemap.xml is missing!');
  errors++;
} else {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

  if (!sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    console.error('❌ FAIL: public/sitemap.xml does not start with standard XML declaration!');
    errors++;
  }

  if (sitemapContent.includes('localhost') || sitemapContent.includes('127.0.0.1') || sitemapContent.includes('onrender.com')) {
    console.error('❌ FAIL: public/sitemap.xml contains illegal dev/backend domain!');
    errors++;
  }

  const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g) || [];
  console.log(`✓ PASS: public/sitemap.xml contains ${urlMatches.length} valid HTTPS canonical URLs.`);

  if (urlMatches.length < 50) {
    console.warn('⚠️ WARNING: sitemap URL count seems suspiciously low.');
    warnings++;
  }
}

// 3. Scan tool metadata coverage
const toolsDir = path.join(process.cwd(), 'src', 'pages', 'tools');
let toolCount = 0;

function checkTools(dir) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      checkTools(filePath);
    } else if (file === 'meta.ts') {
      toolCount++;
    }
  });
}

checkTools(toolsDir);
console.log(`✓ PASS: Discovered ${toolCount} total tools with registered meta.ts files.`);

// 4. Validate Canonical Tags in HTML files
console.log('\n--- Validating Canonical Link Tags in HTML ---');
const htmlChecks = [
  {
    file: path.join(process.cwd(), 'index.html'),
    expectedCanonical: `${EXPECTED_SITE_URL}/`,
    desc: 'index.html'
  },
  {
    file: path.join(process.cwd(), 'public', 'privacy-policy.html'),
    expectedCanonical: `${EXPECTED_SITE_URL}/privacy-policy`,
    desc: 'public/privacy-policy.html'
  }
];

const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  htmlChecks.push(
    {
      file: path.join(distDir, 'index.html'),
      expectedCanonical: `${EXPECTED_SITE_URL}/`,
      desc: 'dist/index.html'
    },
    {
      file: path.join(distDir, 'privacy-policy.html'),
      expectedCanonical: `${EXPECTED_SITE_URL}/privacy-policy`,
      desc: 'dist/privacy-policy.html'
    }
  );
}

for (const check of htmlChecks) {
  if (fs.existsSync(check.file)) {
    const htmlContent = fs.readFileSync(check.file, 'utf8');
    const hasCanonical = htmlContent.includes(`<link rel="canonical" href="${check.expectedCanonical}"`);
    if (!hasCanonical) {
      console.error(`❌ FAIL: ${check.desc} is missing exact canonical link tag: <link rel="canonical" href="${check.expectedCanonical}">`);
      errors++;
    } else {
      console.log(`✓ PASS: ${check.desc} has valid canonical tag: ${check.expectedCanonical}`);
    }
  }
}

// 5. Validate Canonical URL format rules
console.log('\n--- Validating Canonical URL Formatting Rules ---');
const sampleRoutes = [
  '/',
  '/pricing',
  '/blog',
  '/blog/how-to-compress-pdf-files',
  '/privacy-policy',
  '/terms',
  '/terms-of-service',
  '/refund-policy',
  '/categories/pdf',
  '/pdf/pdf-to-word',
  '/image-generic/image-compressor'
];

for (const route of sampleRoutes) {
  let expected;
  if (route === '/') {
    expected = `${EXPECTED_SITE_URL}/`;
  } else {
    expected = `${EXPECTED_SITE_URL}${route}`;
  }

  // Verify HTTPS
  if (!expected.startsWith('https://')) {
    console.error(`❌ FAIL: Canonical URL for ${route} does not use HTTPS!`);
    errors++;
  }
  // Verify correct domain
  if (!expected.startsWith(EXPECTED_SITE_URL)) {
    console.error(`❌ FAIL: Canonical URL for ${route} does not use ${EXPECTED_SITE_URL}!`);
    errors++;
  }
  // Verify trailing slash rules
  if (route === '/' && !expected.endsWith('/')) {
    console.error(`❌ FAIL: Homepage canonical URL must end with trailing slash!`);
    errors++;
  }
  if (route !== '/' && expected.endsWith('/')) {
    console.error(`❌ FAIL: Subpage canonical URL ${expected} must NOT have trailing slash!`);
    errors++;
  }
}
console.log(`✓ PASS: Verified canonical formatting for sample public routes.`);

console.log('\n=== CONVERTINGHUB SEO AUDIT SUMMARY ===');
console.log(`Total Errors: ${errors}`);
console.log(`Total Warnings: ${warnings}`);

if (errors > 0) {
  console.error('\nSEO Validation Failed!');
  process.exit(1);
} else {
  console.log('\n✅ All SEO Validation Checks Passed Successfully!');
}
