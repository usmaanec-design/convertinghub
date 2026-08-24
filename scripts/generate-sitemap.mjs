import fs from 'fs';
import path from 'path';

const SITE_URL = process.env.VITE_SITE_URL || 'https://convertinghub-official.web.app';

function getToolsWithMetadata() {
  const toolsDir = path.join(process.cwd(), 'src', 'pages', 'tools');
  const tools = [];

  function scanDir(dir) {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        scanDir(filePath);
      } else if (file === 'meta.ts') {
        const content = fs.readFileSync(filePath, 'utf8');
        const categoryMatch = content.match(/defineTool\(\s*['"]([^'"]+)['"]/);
        const pathMatch = content.match(/path:\s*['"]([^'"]+)['"]/);
        if (categoryMatch && pathMatch) {
          tools.push({
            category: categoryMatch[1],
            path: pathMatch[1],
            fullRoute: `/${categoryMatch[1]}/${pathMatch[1]}`,
            mtime: stat.mtime
          });
        }
      }
    });
  }

  scanDir(toolsDir);
  return tools;
}

const categories = [
  'converters',
  'pdf',
  'arc-maps',
  'image-generic',
  'string',
  'video',
  'time',
  'audio',
  'json',
  'list',
  'csv',
  'number',
  'png',
  'xml',
  'gif'
];

const blogSlugs = [
  'how-to-convert-pdf-to-word',
  'how-to-compress-pdf-files',
  'how-to-merge-multiple-pdf-files'
];

function getFileMtime(relativeFilePath, fallbackDate) {
  try {
    const fullPath = path.join(process.cwd(), relativeFilePath);
    if (fs.existsSync(fullPath)) {
      return fs.statSync(fullPath).mtime;
    }
  } catch (e) {}
  return fallbackDate;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateSitemapXml() {
  const tools = getToolsWithMetadata();
  const routeMap = new Map(); // route -> mtime Date

  const appMtime = getFileMtime('src/App.tsx', new Date('2026-08-01'));
  const blogMtime = getFileMtime('src/pages/Blog.tsx', new Date('2026-08-01'));

  // Core pages
  routeMap.set('/', appMtime);
  routeMap.set('/blog', blogMtime);
  routeMap.set('/privacy-policy', appMtime);

  // Blog posts
  blogSlugs.forEach((slug) => {
    routeMap.set(`/blog/${slug}`, blogMtime);
  });

  // Tools & Categories
  tools.forEach((t) => {
    let cleanRoute = t.fullRoute.trim().replace(/\/+/g, '/');
    if (cleanRoute.length > 1 && cleanRoute.endsWith('/')) {
      cleanRoute = cleanRoute.slice(0, -1);
    }
    routeMap.set(cleanRoute, t.mtime);

    // Update category mtime to latest tool mtime
    const catRoute = `/categories/${t.category}`;
    const currentCatDate = routeMap.get(catRoute);
    if (!currentCatDate || t.mtime > currentCatDate) {
      routeMap.set(catRoute, t.mtime);
    }
  });

  // Ensure all defined categories exist
  categories.forEach((cat) => {
    const catRoute = `/categories/${cat}`;
    if (!routeMap.has(catRoute)) {
      routeMap.set(catRoute, appMtime);
    }
  });

  const routes = Array.from(routeMap.keys());
  routes.sort(); // Consistent deterministic output

  const xmlEntries = routes
    .map((r) => {
      const priority =
        r === '/'
          ? '1.0'
          : r.startsWith('/categories/')
          ? '0.8'
          : r.startsWith('/blog/')
          ? '0.7'
          : '0.9';
      const changefreq = r === '/' ? 'daily' : 'weekly';
      const rawUrl = `${SITE_URL}${r}`;
      const escapedUrl = rawUrl
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const mtimeDate = routeMap.get(r) || appMtime;
      const lastMod = formatDate(mtimeDate);

      return `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  // Write to public/sitemap.xml
  const publicPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, xml, 'utf8');
  console.log(`[SITEMAP] Successfully wrote ${routes.length} URLs to ${publicPath}`);

  // Write to dist/sitemap.xml if dist exists
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const distPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(distPath, xml, 'utf8');
    console.log(`[SITEMAP] Successfully copied to ${distPath}`);

    // Also copy robots.txt to dist if dist exists
    const publicRobots = path.join(process.cwd(), 'public', 'robots.txt');
    const distRobots = path.join(distDir, 'robots.txt');
    if (fs.existsSync(publicRobots)) {
      fs.copyFileSync(publicRobots, distRobots);
      console.log(`[ROBOTS] Successfully copied to ${distRobots}`);
    }
  }
}

generateSitemapXml();
