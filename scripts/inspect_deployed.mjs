import fs from 'fs';

async function main() {
  const indexJs = await (await fetch('https://convertinghub-official.web.app/assets/index-CNZeyrYT.js')).text();
  const chunkRegex = /["']assets\/([^"']+\.js)["']/g;
  const chunks = [];
  let m;
  while ((m = chunkRegex.exec(indexJs)) !== null) {
    chunks.push(m[1]);
  }
  console.log(`Found ${chunks.length} chunks.`);

  for (const chunk of chunks) {
    const url = `https://convertinghub-official.web.app/assets/${chunk}`;
    const code = await (await fetch(url)).text();
    if (code.includes('pri_') || code.includes('Paddle') || code.includes('live_')) {
      console.log(`\nFound Paddle-related chunk: ${chunk}`);
      const prices = code.match(/pri_[a-zA-Z0-9_-]+/g);
      const tokens = code.match(/(live_|test_)[a-zA-Z0-9_-]+/g);
      const envs = code.match(/["'](production|sandbox)["']/g);
      console.log(' - Prices in bundle:', [...new Set(prices || [])]);
      console.log(' - Token prefixes in bundle:', [...new Set((tokens || []).map(t => t.slice(0, 8) + '...'))]);
      console.log(' - Envs in bundle:', [...new Set(envs || [])]);
    }
  }
}

main().catch(console.error);
