import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile, execSync } from 'child_process';
import crypto from 'crypto';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['*'];
const MAX_CONCURRENT_CONVERSIONS = parseInt(process.env.MAX_CONCURRENT_CONVERSIONS || '5', 10);
const CONVERSION_TIMEOUT_MS = parseInt(process.env.CONVERSION_TIMEOUT_MS || '90000', 10);
const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '52428800', 10); // 50MB
const TEMP_DIR = process.env.TEMP_DIR || os.tmpdir();

let activeConversions = 0;

const ALLOWED_INPUT_EXTS = new Set([
  'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt',
  'odt', 'ods', 'odp', 'txt', 'rtf', 'html', 'csv', 'jpg', 'jpeg', 'png', 'webp'
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
  csv: 'text/csv',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odp: 'application/vnd.oasis.opendocument.presentation'
};

function findLibreOffice() {
  const possiblePaths = [
    process.env.LIBREOFFICE_PATH,
    '/usr/bin/soffice',
    '/usr/bin/libreoffice',
    '/usr/local/bin/soffice',
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files\\LibreOffice 7\\program\\soffice.exe',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice'
  ].filter(Boolean);

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch (e) {}
  }

  try {
    const cmd = os.platform() === 'win32' ? 'where soffice' : 'which soffice';
    const output = execSync(cmd, { encoding: 'utf8', windowsHide: true }).trim();
    const firstLine = output.split(/\r?\n/)[0];
    if (firstLine && fs.existsSync(firstLine)) {
      return firstLine;
    }
  } catch (e) {}

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

function sanitizeFilename(filename) {
  if (!filename) return 'file';
  // Strip path traversal attempts and control characters
  let safeName = path.basename(filename).replace(/[\x00-\x1F\x7F\\/]/g, '_');
  if (safeName.startsWith('.')) safeName = `document_${safeName}`;
  return safeName || 'document';
}

function setCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  let allowedOrigin = '*';

  if (ALLOWED_ORIGINS.includes('*')) {
    allowedOrigin = requestOrigin || '*';
  } else if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    allowedOrigin = requestOrigin;
  } else if (ALLOWED_ORIGINS.length > 0) {
    allowedOrigin = ALLOWED_ORIGINS[0];
  }

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-target-format, x-input-name, authorization');
  res.setHeader('Access-Control-Expose-Headers', 'x-engine-used, x-conversion-status, content-disposition');
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let receivedBytes = 0;

    req.on('data', chunk => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_UPLOAD_SIZE) {
        reject(new Error(`Payload size exceeds maximum allowed limit of ${MAX_UPLOAD_SIZE} bytes.`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipartFormData(bodyBuffer, boundary) {
  const parts = {};
  let fileData = null;
  let fileName = null;

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = 0;

  while (start < bodyBuffer.length) {
    const boundaryIndex = bodyBuffer.indexOf(boundaryBuffer, start);
    if (boundaryIndex === -1) break;

    const nextBoundaryIndex = bodyBuffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
    if (nextBoundaryIndex === -1) break;

    const partBuffer = bodyBuffer.subarray(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex);
    const headerEndIndex = partBuffer.indexOf(Buffer.from('\r\n\r\n'));

    if (headerEndIndex !== -1) {
      const headerText = partBuffer.subarray(0, headerEndIndex).toString('utf8');
      const contentBuffer = partBuffer.subarray(headerEndIndex + 4, partBuffer.length - 2); // trim trailing \r\n

      const nameMatch = headerText.match(/name="([^"]+)"/);
      const filenameMatch = headerText.match(/filename="([^"]+)"/);

      if (filenameMatch) {
        fileName = filenameMatch[1];
        fileData = contentBuffer;
      } else if (nameMatch) {
        parts[nameMatch[1]] = contentBuffer.toString('utf8').trim();
      }
    }

    start = nextBoundaryIndex;
  }

  return { parts, fileData, fileName };
}

function validateZipFileHeader(buffer) {
  if (!buffer || buffer.length < 4) return false;
  // ZIP Magic Number: 0x50 0x4B 0x03 0x04 ("PK\x03\x04")
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

function runSofficeCommand(executable, args, timeoutMs = CONVERSION_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    execFile(
      executable,
      args,
      {
        timeout: timeoutMs,
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
    const req = http.get(`http://127.0.0.1:${PORT}/health`, { timeout: 1500 }, (res) => {
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
    console.log(`[ConvertingHub Backend] Local bridge is ALREADY running on http://127.0.0.1:${PORT}. Exiting duplicate launcher silently.`);
    process.exit(0);
    return;
  }

  const server = http.createServer(async (req, res) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // GET /health or /api/health or /api/libreoffice/health or /api/libreoffice or /status
    if (req.method === 'GET' && (
      url.pathname === '/health' ||
      url.pathname === '/api/health' ||
      url.pathname === '/api/libreoffice/health' ||
      url.pathname === '/api/libreoffice' ||
      url.pathname === '/api/libreoffice/status' ||
      url.pathname === '/status'
    )) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: cachedInfo.installed ? 'ok' : 'degraded',
        installed: cachedInfo.installed,
        libreoffice: cachedInfo.installed,
        version: cachedInfo.version,
        path: cachedInfo.path,
        activeConversions,
        maxConcurrency: MAX_CONCURRENT_CONVERSIONS,
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // POST /api/libreoffice/test or /test
    if (req.method === 'POST' && (url.pathname === '/api/libreoffice/test' || url.pathname === '/test')) {
      if (!cachedInfo.installed) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'LibreOffice soffice executable is not detected on backend server.' }));
        return;
      }

      const testId = crypto.randomUUID();
      const testDir = path.join(TEMP_DIR, `omni_test_${testId}`);
      const userProfileDir = path.join(testDir, 'profile').replace(/\\/g, '/');

      try {
        fs.mkdirSync(testDir, { recursive: true });
        const testHtmlPath = path.join(testDir, 'test.html');
        fs.writeFileSync(testHtmlPath, '<h1>ConvertingHub LibreOffice Engine Test</h1><p>Backend document pipeline operational.</p>');

        const testArgs = [
          '--headless',
          `-env:UserInstallation=file:///${userProfileDir}`,
          '--convert-to', 'pdf',
          '--outdir', testDir,
          testHtmlPath
        ];

        const startTime = Date.now();
        await runSofficeCommand(cachedInfo.path, testArgs, 15000);
        const durationMs = Date.now() - startTime;

        const outputPdf = path.join(testDir, 'test.pdf');
        if (fs.existsSync(outputPdf) && fs.statSync(outputPdf).size > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: `LibreOffice ${cachedInfo.version} test conversion succeeded!`,
            version: cachedInfo.version,
            durationMs
          }));
        } else {
          throw new Error('Test output PDF file was empty or not generated.');
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      } finally {
        try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) {}
      }
      return;
    }

    // POST /api/libreoffice or /api/libreoffice/convert or /api/convert or /convert
    if (req.method === 'POST' && (url.pathname === '/api/libreoffice' || url.pathname === '/api/libreoffice/convert' || url.pathname === '/api/convert' || url.pathname === '/convert')) {
      if (!cachedInfo.installed) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'LibreOffice is not installed or soffice path is invalid on the conversion server.' }));
        return;
      }

      if (activeConversions >= MAX_CONCURRENT_CONVERSIONS) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Retry-After': '5'
        });
        res.end(JSON.stringify({ error: `Server is busy. Maximum concurrent conversions (${MAX_CONCURRENT_CONVERSIONS}) reached. Please retry in a few seconds.` }));
        return;
      }

      const jobId = crypto.randomUUID();
      const startTime = Date.now();
      const tmpDir = path.join(TEMP_DIR, `omni_conv_${jobId}`);
      const userProfileDir = path.join(tmpDir, 'profile').replace(/\\/g, '/');

      activeConversions++;

      try {
        const contentType = req.headers['content-type'] || '';
        let fileBuffer = null;
        let inputFilename = req.headers['x-input-name'] || url.searchParams.get('inputName') || 'document.pdf';
        let targetFormat = (req.headers['x-target-format'] || url.searchParams.get('targetFormat') || 'pdf').toLowerCase().replace('.', '');

        if (contentType.includes('multipart/form-data')) {
          const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
          const boundary = match ? (match[1] || match[2]) : null;

          if (!boundary) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing boundary in multipart/form-data payload.' }));
            return;
          }

          const rawBody = await getRawBody(req);
          const { parts, fileData, fileName } = parseMultipartFormData(rawBody, boundary);

          if (fileData) fileBuffer = fileData;
          if (fileName) inputFilename = fileName;
          if (parts.targetFormat) targetFormat = parts.targetFormat.toLowerCase().replace('.', '');
        } else {
          fileBuffer = await getRawBody(req);
        }

        if (!fileBuffer || fileBuffer.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Empty file payload received.' }));
          return;
        }

        const safeInputName = sanitizeFilename(inputFilename);
        const extMatch = safeInputName.match(/\.([a-z0-9]+)$/i);
        const inputExt = extMatch ? extMatch[1].toLowerCase() : 'pdf';

        if (!ALLOWED_TARGET_FORMATS.has(targetFormat)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Unsupported target format: .${targetFormat}` }));
          return;
        }

        if (!ALLOWED_INPUT_EXTS.has(inputExt)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Unsupported input file extension: .${inputExt}` }));
          return;
        }

        fs.mkdirSync(tmpDir, { recursive: true });

        const inputFilePath = path.join(tmpDir, `input.${inputExt}`);
        fs.writeFileSync(inputFilePath, fileBuffer);

        const baseOriginalName = safeInputName.substring(0, safeInputName.lastIndexOf('.')) || safeInputName;
        const outputFilename = `${baseOriginalName}.${targetFormat}`;

        const sofficeArgs = [
          '--headless',
          `-env:UserInstallation=file:///${userProfileDir}`
        ];

        if (inputExt === 'pdf') {
          if (targetFormat === 'docx' || targetFormat === 'doc') {
            sofficeArgs.push('--infilter=writer_pdf_import');
          } else if (targetFormat === 'pptx' || targetFormat === 'ppt') {
            sofficeArgs.push('--infilter=impress_pdf_import');
          }
        }

        sofficeArgs.push('--convert-to', targetFormat, '--outdir', tmpDir, inputFilePath);

        const { stdout, stderr } = await runSofficeCommand(cachedInfo.path, sofficeArgs, CONVERSION_TIMEOUT_MS);
        const durationMs = Date.now() - startTime;

        let outputFilePath = path.join(tmpDir, `input.${targetFormat}`);

        if (!fs.existsSync(outputFilePath)) {
          const files = fs.readdirSync(tmpDir);
          const match = files.find(f => f.endsWith(`.${targetFormat}`));
          if (!match) {
            throw new Error(`LibreOffice conversion finished but output file .${targetFormat} was not generated.`);
          }
          outputFilePath = path.join(tmpDir, match);
        }

        const convertedBuffer = fs.readFileSync(outputFilePath);

        if (convertedBuffer.length === 0) {
          throw new Error('Generated output document was 0 bytes in size.');
        }

        // Validate ZIP structure for OpenXML formats
        if (['docx', 'xlsx', 'pptx'].includes(targetFormat)) {
          const isValidZip = validateZipFileHeader(convertedBuffer);
          if (!isValidZip) {
            throw new Error(`Generated ${targetFormat.toUpperCase()} file failed structural validation check.`);
          }
        }

        console.log(`[ConvertingHub Backend] [Job: ${jobId}]
Input: ${safeInputName} (${fileBuffer.length} bytes)
Target: ${targetFormat}
Duration: ${durationMs} ms
Output: ${outputFilename} (${convertedBuffer.length} bytes)`);

        const mimeType = MIME_TYPES[targetFormat] || 'application/octet-stream';
        const encodedFilename = encodeURIComponent(outputFilename);

        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Length': convertedBuffer.length,
          'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
          'x-engine-used': 'LibreOffice Headless',
          'x-conversion-status': 'success',
          'x-job-id': jobId
        });
        res.end(convertedBuffer);

      } catch (err) {
        const durationMs = Date.now() - startTime;
        console.error(`[ConvertingHub Backend ERROR] [Job: ${jobId}]
Target: ${targetFormat || 'unknown'}
Duration: ${durationMs} ms
Error: ${err.message}`);

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: `Conversion failed: ${err.message}`,
          jobId,
          durationMs
        }));
      } finally {
        activeConversions = Math.max(0, activeConversions - 1);
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (e) {}
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });

  server.listen(PORT, HOST, () => {
    console.log(`[ConvertingHub Backend] Server running on http://${HOST}:${PORT}`);
    if (cachedInfo.installed) {
      console.log(`[ConvertingHub Backend] LibreOffice ${cachedInfo.version} ready at ${cachedInfo.path}`);
    } else {
      console.warn(`[ConvertingHub Backend] WARNING: LibreOffice soffice executable NOT found on host system.`);
    }
  });
}

startBridgeServer().catch(console.error);
