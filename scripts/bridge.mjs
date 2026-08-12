import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile, execSync } from 'child_process';
import crypto from 'crypto';

const PORT = process.env.PORT || 3001;

const ALLOWED_INPUT_EXTS = new Set([
  'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 
  'odt', 'ods', 'odp', 'txt', 'rtf', 'html', 'csv', 'jpg', 'png'
]);

const ALLOWED_TARGET_FORMATS = new Set([
  'pptx', 'docx', 'xlsx', 'pdf', 'txt', 'html', 'csv', 'odt', 'ods', 'odp'
]);

const MIME_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  html: 'text/html',
  csv: 'text/csv'
};

function findLibreOffice() {
  const possiblePaths = [
    process.env.LIBREOFFICE_PATH,
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files\\LibreOffice 7\\program\\soffice.exe',
    '/usr/bin/soffice',
    '/usr/bin/libreoffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice'
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  try {
    const cmd = os.platform() === 'win32' ? 'where soffice' : 'which soffice';
    const output = execSync(cmd, { encoding: 'utf8', windowsHide: true }).trim();
    const firstLine = output.split(/\r?\n/)[0];
    if (firstLine && fs.existsSync(firstLine)) {
      return firstLine;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

function getLibreOfficeVersion(sofficePath) {
  if (!sofficePath) return null;
  try {
    const output = execSync(`"${sofficePath}" --version`, { encoding: 'utf8', timeout: 5000, windowsHide: true }).trim();
    const match = output.match(/LibreOffice\s+([\d\.]+)/i);
    return match ? match[1] : output;
  } catch (e) {
    return 'Installed';
  }
}

const cachedSofficePath = findLibreOffice();
const cachedVersion = getLibreOfficeVersion(cachedSofficePath);
const cachedInfo = {
  installed: !!cachedSofficePath,
  version: cachedVersion,
  path: cachedSofficePath,
  status: cachedSofficePath ? 'connected' : 'not_installed'
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-target-format, x-input-name');
  res.setHeader('Access-Control-Expose-Headers', 'x-engine-used, x-conversion-status');
}

function runSofficeCommand(executable, args) {
  return new Promise((resolve, reject) => {
    execFile(
      executable,
      args,
      {
        timeout: 35000,
        maxBuffer: 50 * 1024 * 1024,
        windowsHide: true
      },
      (err, stdout, stderr) => {
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          return reject(err);
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

async function checkExistingBridge() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/api/libreoffice/status`, { timeout: 1500 }, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startBridgeServer() {
  const isRunning = await checkExistingBridge();
  if (isRunning) {
    console.log(`[OmniTools Bridge] Local bridge is ALREADY running on http://127.0.0.1:${PORT}. Exiting duplicate launcher silently.`);
    process.exit(0);
    return;
  }

  const server = http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && (url.pathname === '/api/libreoffice/status' || url.pathname === '/status')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cachedInfo));
      return;
    }

    if (req.method === 'POST' && (url.pathname === '/api/libreoffice/test' || url.pathname === '/test')) {
      if (!cachedInfo.installed) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'LibreOffice soffice.exe is not detected on local system.' }));
        return;
      }

      const testDir = path.join(os.tmpdir(), `omni_test_${crypto.randomUUID()}`);
      const userProfileDir = path.join(testDir, 'profile').replace(/\\/g, '/');
      try {
        fs.mkdirSync(testDir, { recursive: true });
        const testHtmlPath = path.join(testDir, 'test.html');
        fs.writeFileSync(testHtmlPath, '<h1>OmniTools LibreOffice Test</h1><p>Engine pipeline verified successfully.</p>');

        const testArgs = [
          '--headless',
          `-env:UserInstallation=file:///${userProfileDir}`,
          '--convert-to', 'pdf',
          '--outdir', testDir,
          testHtmlPath
        ];

        await runSofficeCommand(cachedInfo.path, testArgs);

        const outputPdf = path.join(testDir, 'test.pdf');
        if (fs.existsSync(outputPdf) && fs.statSync(outputPdf).size > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: `LibreOffice ${cachedInfo.version} test conversion succeeded!`, version: cachedInfo.version }));
        } else {
          throw new Error('Test output file was empty or not generated.');
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      } finally {
        try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) {}
      }
      return;
    }

    if (req.method === 'POST' && (url.pathname === '/api/libreoffice/convert' || url.pathname === '/convert')) {
      if (!cachedInfo.installed) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'LibreOffice is not installed or soffice.exe path is invalid.' }));
        return;
      }

      const targetFormat = (req.headers['x-target-format'] || url.searchParams.get('targetFormat') || 'pdf').toLowerCase();
      const inputName = req.headers['x-input-name'] || url.searchParams.get('inputName') || `document.pdf`;
      const ext = path.extname(inputName).replace('.', '').toLowerCase() || 'pdf';

      if (ext === 'pdf' && (targetFormat === 'xlsx' || targetFormat === 'xls')) {
        console.warn(`[OmniTools Bridge]\nInput: ${inputName}\nTarget: ${targetFormat}\nNote: LibreOffice has no native export filter for PDF to XLSX. Redirecting to PDF Table Extraction Engine.`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'LibreOffice does not support direct PDF to XLSX export filter. Using PDF Table Extraction Engine.' }));
        return;
      }

      if (!ALLOWED_TARGET_FORMATS.has(targetFormat)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Unsupported target format: ${targetFormat}` }));
        return;
      }

      if (!ALLOWED_INPUT_EXTS.has(ext)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Unsupported input format extension: .${ext}` }));
        return;
      }

      const startTime = Date.now();
      const tmpDir = path.join(os.tmpdir(), `omni_conv_${crypto.randomUUID()}`);
      const userProfileDir = path.join(tmpDir, 'profile').replace(/\\/g, '/');

      const sofficeArgs = [
        '--headless',
        `-env:UserInstallation=file:///${userProfileDir}`
      ];

      if (ext === 'pdf') {
        if (targetFormat === 'docx' || targetFormat === 'doc') {
          sofficeArgs.push('--infilter=writer_pdf_import');
        } else if (targetFormat === 'pptx' || targetFormat === 'ppt') {
          sofficeArgs.push('--infilter=impress_pdf_import');
        }
      }
      sofficeArgs.push('--convert-to', targetFormat, '--outdir', tmpDir);

      try {
        fs.mkdirSync(tmpDir, { recursive: true });
        const bodyBuffer = await getRawBody(req);

        if (!bodyBuffer || bodyBuffer.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Empty file payload received.' }));
          return;
        }

        const inputFilePath = path.join(tmpDir, `input.${ext}`);
        fs.writeFileSync(inputFilePath, bodyBuffer);

        sofficeArgs.push(inputFilePath);

        const { stdout, stderr } = await runSofficeCommand(cachedInfo.path, sofficeArgs);
        const duration = Date.now() - startTime;
        const endTime = Date.now();

        let outputFilePath = path.join(tmpDir, `input.${targetFormat}`);

        if (!fs.existsSync(outputFilePath)) {
          const files = fs.readdirSync(tmpDir);
          const match = files.find(f => f.endsWith(`.${targetFormat}`));
          if (!match) {
            throw new Error(`LibreOffice finished with exit code 0 but target .${targetFormat} output file was not generated.`);
          }
          outputFilePath = path.join(tmpDir, match);
        }

        const convertedBuffer = fs.readFileSync(outputFilePath);

        console.log(`[OmniTools Bridge]
Input: ${inputName} (${bodyBuffer.length} bytes)
Target: ${targetFormat}
LibreOffice executable: ${cachedInfo.path}
Arguments: ${sofficeArgs.join(' ')}
Start time: ${new Date(startTime).toISOString()}
End time: ${new Date(endTime).toISOString()}
Duration: ${duration} ms
Exit code: 0
stdout: "${stdout.trim()}"
stderr: "${stderr.trim()}"
Output file: ${path.basename(outputFilePath)} (${convertedBuffer.length} bytes)`);

        res.writeHead(200, {
          'Content-Type': MIME_TYPES[targetFormat] || 'application/octet-stream',
          'Content-Length': convertedBuffer.length,
          'x-engine-used': 'LibreOffice Headless',
          'x-conversion-status': 'success'
        });
        res.end(convertedBuffer);

      } catch (err) {
        const duration = Date.now() - startTime;
        const endTime = Date.now();

        console.error(`[OmniTools Bridge - CONVERSION ERROR]
Input: ${inputName}
Target: ${targetFormat}
LibreOffice executable: ${cachedInfo.path}
Arguments: ${sofficeArgs.join(' ')}
Start time: ${new Date(startTime).toISOString()}
End time: ${new Date(endTime).toISOString()}
Duration: ${duration} ms
Exit code: ${err.code || 1}
stdout: "${(err.stdout || '').trim()}"
stderr: "${(err.stderr || err.message || '').trim()}"
Output files: None`);

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: `LibreOffice conversion failed: ${err.message}`,
          stderr: err.stderr || null,
          durationMs: duration
        }));
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (e) {}
      }
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, () => {
    console.log(`[OmniTools Bridge] LibreOffice bridge running on http://${HOST}:${PORT}`);
    if (cachedInfo.installed) {
      console.log(`[OmniTools Bridge] Detected LibreOffice ${cachedInfo.version} at ${cachedInfo.path}`);
    } else {
      console.warn(`[OmniTools Bridge] WARNING: LibreOffice soffice.exe not found on system.`);
    }
  });
}

startBridgeServer().catch(console.error);
