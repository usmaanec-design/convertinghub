import fs from 'node:fs';
import path from 'node:path';

function searchInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchInDir(full);
    } else if (entry.name.endsWith('.js')) {
      const txt = fs.readFileSync(full, 'utf-8');
      if (txt.includes('androidSdkPath') || txt.includes('The androidSdkPath isn')) {
        console.log('\n=======================================');
        console.log('File:', full);
        const lines = txt.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('androidSdkPath') || line.includes('build-tools') || line.includes('The androidSdkPath')) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchInDir(path.resolve('node_modules/@bubblewrap/core/dist'));
searchInDir(path.resolve('node_modules/@bubblewrap/cli/dist'));
