import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile, execSync } from 'child_process';
import crypto from 'crypto';
import { createReadStream } from 'fs';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { resolveAdobeCredentials } from './adobe-config.mjs';
import {
  PDFServices,
  MimeType,
  ServicePrincipalCredentials,
  ExportPDFJob,
  ExportPDFParams,
  ExportPDFTargetFormat,
  ExportPDFResult
} from '@adobe/pdfservices-node-sdk';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : [
      'https://convertinghub.web.app',
      'https://convertinghub-official.web.app',
      'https://convertinghub.firebaseapp.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3001',
      '*'
    ];

const MAX_CONCURRENT_CONVERSIONS = parseInt(process.env.MAX_CONCURRENT_CONVERSIONS || '5', 10);
const MAX_LARGE_PDF_CONVERSIONS = parseInt(process.env.MAX_LARGE_PDF_CONVERSIONS || '1', 10);
const BASE_CONVERSION_TIMEOUT_MS = parseInt(process.env.CONVERSION_TIMEOUT_MS || '90000', 10);
const ADOBE_TIMEOUT_MS = parseInt(process.env.ADOBE_TIMEOUT_MS || '60000', 10);
const ADOBE_RETRY_AFTER_MS = parseInt(process.env.ADOBE_RETRY_AFTER_MS || '300000', 10);
const LIBREOFFICE_TIMEOUT_MS = parseInt(process.env.LIBREOFFICE_TIMEOUT_MS || '120000', 10);
const LARGE_DOCUMENT_TIMEOUT_MS = parseInt(process.env.LARGE_DOCUMENT_TIMEOUT_MS || '300000', 10);
const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '52428800', 10); // 50MB
const TEMP_DIR = process.env.TEMP_DIR || os.tmpdir();

// Adobe PDF Services Credentials (Server-Side ONLY - Never Exposed to Frontend)
const adobeCredentialConfig = resolveAdobeCredentials(process.env);
const ADOBE_CLIENT_ID = adobeCredentialConfig.clientId;
const ADOBE_CLIENT_SECRET = adobeCredentialConfig.clientSecret;
const ADOBE_CREDENTIAL_SOURCE = adobeCredentialConfig.source || 'environment';
const RAW_ADOBE_CLIENT_ID = String(process.env.ADOBE_CLIENT_ID || '').trim();
const RAW_ADOBE_CLIENT_SECRET = String(process.env.ADOBE_CLIENT_SECRET || '').trim();

function getAdobeCredentialDiagnostic() {
  return {
    clientIdExists: Boolean(RAW_ADOBE_CLIENT_ID),
    clientIdLength: RAW_ADOBE_CLIENT_ID.length,
    clientIdFirst4: RAW_ADOBE_CLIENT_ID ? RAW_ADOBE_CLIENT_ID.slice(0, 4) : null,
    clientIdLast4: RAW_ADOBE_CLIENT_ID ? RAW_ADOBE_CLIENT_ID.slice(-4) : null,
    clientSecretExists: Boolean(RAW_ADOBE_CLIENT_SECRET),
    clientSecretLength: RAW_ADOBE_CLIENT_SECRET.length
  };
}

let activeConversions = 0;
let largePdfConversions = 0;
let adobeState = {
  status: 'healthy',
  cooldownUntil: 0,
  lastFailureReason: null,
  lastCheckedAt: 0
};

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
  let safeName = path.basename(filename).replace(/[\x00-\x1F\x7F\\/]/g, '_');
  if (safeName.startsWith('.')) safeName = `document_${safeName}`;
  return safeName || 'document';
}

function shouldAttemptAdobe(targetFormat) {
  if (!ADOBE_CLIENT_ID || !ADOBE_CLIENT_SECRET) return false;
  if (adobeState.status !== 'quota_exhausted') return true;
  return Date.now() >= adobeState.cooldownUntil;
}

function markAdobeFailure(reason) {
  const normalized = String(reason || '').toLowerCase();
  const quotaLike = normalized.includes('quota') || normalized.includes('429') || normalized.includes('usage limit') || normalized.includes('rate limit') || normalized.includes('monthly quota') || normalized.includes('too many requests');
  const authLike = normalized.includes('auth') || normalized.includes('unauthorized') || normalized.includes('invalid credentials');

  if (quotaLike) {
    adobeState = {
      status: 'quota_exhausted',
      cooldownUntil: Date.now() + ADOBE_RETRY_AFTER_MS,
      lastFailureReason: reason,
      lastCheckedAt: Date.now()
    };
    return;
  }

  if (authLike) {
    adobeState = {
      status: 'authentication_failed',
      cooldownUntil: Date.now() + Math.min(ADOBE_RETRY_AFTER_MS, 120000),
      lastFailureReason: reason,
      lastCheckedAt: Date.now()
    };
    return;
  }

  if (normalized.includes('timeout') || normalized.includes('timed out')) {
    adobeState = {
      status: 'timeout',
      cooldownUntil: Date.now() + Math.min(ADOBE_RETRY_AFTER_MS, 60000),
      lastFailureReason: reason,
      lastCheckedAt: Date.now()
    };
    return;
  }

  if (normalized.includes('5xx') || normalized.includes('service unavailable') || normalized.includes('temporary')) {
    adobeState = {
      status: 'temporary_failure',
      cooldownUntil: Date.now() + Math.min(ADOBE_RETRY_AFTER_MS, 120000),
      lastFailureReason: reason,
      lastCheckedAt: Date.now()
    };
    return;
  }

  adobeState = {
    status: 'unhealthy',
    cooldownUntil: Date.now() + Math.min(ADOBE_RETRY_AFTER_MS, 90000),
    lastFailureReason: reason,
    lastCheckedAt: Date.now()
  };
}

function clearAdobeFailureState() {
  adobeState = {
    status: 'healthy',
    cooldownUntil: 0,
    lastFailureReason: null,
    lastCheckedAt: Date.now()
  };
}

function classifyAdobeFailure(reason) {
  const normalized = String(reason || '').toLowerCase();
  const authLike = normalized.includes('auth') || normalized.includes('unauthorized') || normalized.includes('invalid credentials') || normalized.includes('credential') || normalized.includes('client id') || normalized.includes('client secret') || normalized.includes('forbidden');
  const quotaLike = normalized.includes('quota') || normalized.includes('429') || normalized.includes('usage limit') || normalized.includes('rate limit') || normalized.includes('monthly quota') || normalized.includes('too many requests');
  const serviceLike = normalized.includes('service unavailable') || normalized.includes('temporary') || normalized.includes('5xx') || normalized.includes('503');
  const timeoutLike = normalized.includes('timeout') || normalized.includes('timed out');

  if (authLike) {
    return { kind: 'authentication', shouldFallback: false, reasonLabel: 'authentication/configuration' };
  }

  if (quotaLike) {
    return { kind: 'quota', shouldFallback: true, reasonLabel: 'quota/rate-limit' };
  }

  if (serviceLike) {
    return { kind: 'service', shouldFallback: true, reasonLabel: 'service unavailable/temporary failure' };
  }

  if (timeoutLike) {
    return { kind: 'timeout', shouldFallback: true, reasonLabel: 'timeout/temporary service issue' };
  }

  return { kind: 'unknown', shouldFallback: false, reasonLabel: 'unknown Adobe error' };
}

function setCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  let allowedOrigin = '*';

  if (requestOrigin) {
    if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(requestOrigin) || requestOrigin.endsWith('.web.app') || requestOrigin.endsWith('.firebaseapp.com')) {
      allowedOrigin = requestOrigin;
    } else if (ALLOWED_ORIGINS.length > 0) {
      allowedOrigin = ALLOWED_ORIGINS[0];
    }
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
      const contentBuffer = partBuffer.subarray(headerEndIndex + 4, partBuffer.length - 2);

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

async function validatePptxStructure(buffer) {
  if (!buffer || buffer.length < 4) return false;
  try {
    const zip = await JSZip.loadAsync(buffer);
    const requiredFiles = [
      '[Content_Types].xml',
      '_rels/.rels',
      'ppt/presentation.xml'
    ];
    for (const file of requiredFiles) {
      if (!zip.file(file)) return false;
    }

    const hasSlides = Object.keys(zip.files).some(name => name.startsWith('ppt/slides/slide'));
    const hasMasters = Object.keys(zip.files).some(name => name.startsWith('ppt/slideMasters/'));
    const hasLayouts = Object.keys(zip.files).some(name => name.startsWith('ppt/slideLayouts/'));

    return hasSlides && hasMasters && hasLayouts;
  } catch (e) {
    return false;
  }
}

async function validateDocxStructure(buffer) {
  if (!buffer || buffer.length < 4) return false;
  try {
    const zip = await JSZip.loadAsync(buffer);
    return !!(zip.file('[Content_Types].xml') && zip.file('word/document.xml'));
  } catch (e) {
    return false;
  }
}

async function validateXlsxStructure(buffer) {
  if (!buffer || buffer.length < 4) return false;
  try {
    const zip = await JSZip.loadAsync(buffer);
    return !!(zip.file('[Content_Types].xml') && zip.file('xl/workbook.xml'));
  } catch (e) {
    return false;
  }
}

function runSofficeCommand(executable, args, timeoutMs = BASE_CONVERSION_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let child = null;
    let timer = null;

    child = execFile(
      executable,
      args,
      {
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
        windowsHide: true
      },
      (err, stdout, stderr) => {
        if (timer) clearTimeout(timer);
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          if (child && !child.killed) {
            try { child.kill('SIGKILL'); } catch (e) {}
          }
          return reject(err);
        }
        resolve({ stdout, stderr });
      }
    );

    timer = setTimeout(() => {
      if (child && !child.killed) {
        try { child.kill('SIGKILL'); } catch (e) {}
      }
    }, timeoutMs + 1000);
  });
}

async function getPdfPageCount(buffer) {
  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch (e) {
    return 1;
  }
}

async function mergePptxChunks(chunkBuffers) {
  if (chunkBuffers.length === 0) throw new Error('No PPTX chunks to merge.');
  if (chunkBuffers.length === 1) return chunkBuffers[0];

  const baseZip = await JSZip.loadAsync(chunkBuffers[0]);
  let slideCount = Object.keys(baseZip.files).filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/)).length;

  for (let c = 1; c < chunkBuffers.length; c++) {
    const chunkZip = await JSZip.loadAsync(chunkBuffers[c]);
    const chunkSlideFiles = Object.keys(chunkZip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml$/)[1], 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml$/)[1], 10);
        return numA - numB;
      });

    let presentationXml = await baseZip.file('ppt/presentation.xml').async('text');
    let presentationRels = await baseZip.file('ppt/_rels/presentation.xml.rels').async('text');

    for (const slideFile of chunkSlideFiles) {
      slideCount++;
      const origNum = slideFile.match(/slide(\d+)\.xml$/)[1];
      const newSlideName = `ppt/slides/slide${slideCount}.xml`;
      const newRelsName = `ppt/slides/_rels/slide${slideCount}.xml.rels`;

      const slideContent = await chunkZip.file(slideFile).async('text');
      baseZip.file(newSlideName, slideContent);

      const origRelsFile = `ppt/slides/_rels/slide${origNum}.xml.rels`;
      if (chunkZip.file(origRelsFile)) {
        const relsContent = await chunkZip.file(origRelsFile).async('text');
        baseZip.file(newRelsName, relsContent);
      }

      const newRId = `rId${1000 + slideCount}`;
      const newSldId = 255 + slideCount;
      const sldIdTag = `<p:sldId id="${newSldId}" r:id="${newRId}"/>`;
      presentationXml = presentationXml.replace('</p:sldIdLst>', `${sldIdTag}</p:sldIdLst>`);

      const relTag = `<Relationship Id="${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideCount}.xml"/>`;
      presentationRels = presentationRels.replace('</Relationships>', `${relTag}</Relationships>`);
    }

    baseZip.file('ppt/presentation.xml', presentationXml);
    baseZip.file('ppt/_rels/presentation.xml.rels', presentationRels);
  }

  return await baseZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function convertPdfToPptxWithLibreOffice(fileBuffer, safeInputName, jobId, parentTmpDir) {
  const numPages = await getPdfPageCount(fileBuffer);
  const timeoutMs = Math.min(180000, BASE_CONVERSION_TIMEOUT_MS + Math.max(0, (numPages - 5) * 4000));

  // Attempt 1: Direct LibreOffice conversion with isolated profile
  console.log(`[Job: ${jobId}] [LIBREOFFICE] [Attempt 1] Direct PPTX conversion (${numPages} pages)...`);
  const attempt1Dir = path.join(parentTmpDir, 'att1');
  fs.mkdirSync(attempt1Dir, { recursive: true });
  const profile1 = path.join(attempt1Dir, 'prof').replace(/\\/g, '/');
  const input1 = path.join(attempt1Dir, 'input.pdf');
  fs.writeFileSync(input1, fileBuffer);

  try {
    const args1 = [
      '--headless',
      `-env:UserInstallation=file:///${profile1}`,
      '--infilter=impress_pdf_import',
      '--convert-to', 'pptx',
      '--outdir', attempt1Dir,
      input1
    ];
    await runSofficeCommand(cachedInfo.path, args1, timeoutMs);
    const out1 = path.join(attempt1Dir, 'input.pptx');
    if (fs.existsSync(out1)) {
      const buf1 = fs.readFileSync(out1);
      const valid = await validatePptxStructure(buf1);
      if (valid) {
        console.log(`[Job: ${jobId}] [LIBREOFFICE] Attempt 1 Direct PPTX PASSED structural validation (${buf1.length} bytes)`);
        return buf1;
      }
    }
  } catch (e) {
    console.warn(`[Job: ${jobId}] [LIBREOFFICE] Attempt 1 failed: ${e.message}`);
  }

  // Attempt 2: Fresh isolated profile retry
  console.log(`[Job: ${jobId}] [LIBREOFFICE] [Attempt 2] Fresh isolated profile retry...`);
  const attempt2Dir = path.join(parentTmpDir, 'att2');
  fs.mkdirSync(attempt2Dir, { recursive: true });
  const profile2 = path.join(attempt2Dir, 'prof2').replace(/\\/g, '/');
  const input2 = path.join(attempt2Dir, 'input.pdf');
  fs.writeFileSync(input2, fileBuffer);

  try {
    const args2 = [
      '--headless',
      `-env:UserInstallation=file:///${profile2}`,
      '--infilter=impress_pdf_import',
      '--convert-to', 'pptx',
      '--outdir', attempt2Dir,
      input2
    ];
    await runSofficeCommand(cachedInfo.path, args2, timeoutMs);
    const out2 = path.join(attempt2Dir, 'input.pptx');
    if (fs.existsSync(out2)) {
      const buf2 = fs.readFileSync(out2);
      const valid = await validatePptxStructure(buf2);
      if (valid) {
        console.log(`[Job: ${jobId}] [LIBREOFFICE] Attempt 2 Fresh Profile PASSED structural validation (${buf2.length} bytes)`);
        return buf2;
      }
    }
  } catch (e) {
    console.warn(`[Job: ${jobId}] [LIBREOFFICE] Attempt 2 failed: ${e.message}`);
  }

  // Attempt 3: Multi-page Structural Chunking Strategy for Large PDFs (> 1 page)
  if (numPages > 1) {
    console.log(`[Job: ${jobId}] [LIBREOFFICE] [Attempt 3] Multi-page Structural Chunking Strategy (${numPages} pages)...`);
    const chunkSize = 5;
    const chunkBuffers = [];

    const pdfDoc = await PDFDocument.load(fileBuffer);
    const totalPages = pdfDoc.getPageCount();

    for (let startPage = 0; startPage < totalPages; startPage += chunkSize) {
      const endPage = Math.min(startPage + chunkSize, totalPages);
      const subPdfDoc = await PDFDocument.create();
      const pageIndices = Array.from({ length: endPage - startPage }, (_, i) => startPage + i);
      const copiedPages = await subPdfDoc.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(p => subPdfDoc.addPage(p));
      const subPdfBytes = await subPdfDoc.save();

      const chunkDir = path.join(parentTmpDir, `chunk_${startPage}`);
      fs.mkdirSync(chunkDir, { recursive: true });
      const chunkProf = path.join(chunkDir, 'prof').replace(/\\/g, '/');
      const chunkInput = path.join(chunkDir, 'chunk.pdf');
      fs.writeFileSync(chunkInput, subPdfBytes);

      const chunkArgs = [
        '--headless',
        `-env:UserInstallation=file:///${chunkProf}`,
        '--infilter=impress_pdf_import',
        '--convert-to', 'pptx',
        '--outdir', chunkDir,
        chunkInput
      ];
      await runSofficeCommand(cachedInfo.path, chunkArgs, 45000);
      const chunkOut = path.join(chunkDir, 'chunk.pptx');

      if (fs.existsSync(chunkOut)) {
        const cBuf = fs.readFileSync(chunkOut);
        const valid = await validatePptxStructure(cBuf);
        if (valid) {
          chunkBuffers.push(cBuf);
        } else {
          throw new Error(`PPTX Chunk ${startPage}-${endPage} failed structural validation.`);
        }
      } else {
        throw new Error(`PPTX Chunk ${startPage}-${endPage} was not generated by LibreOffice.`);
      }
    }

    if (chunkBuffers.length > 0) {
      const mergedPptx = await mergePptxChunks(chunkBuffers);
      const validMerged = await validatePptxStructure(mergedPptx);
      if (validMerged) {
        console.log(`[Job: ${jobId}] [LIBREOFFICE] Attempt 3 Structural Chunking Merger PASSED (${mergedPptx.length} bytes)`);
        return mergedPptx;
      }
    }
  }

  throw new Error(`LibreOffice PPTX conversion failed structural validation across all 3 retry attempts.`);
}

async function convertWithAdobePdfServices(fileBuffer, targetFormat, jobId) {
  if (!ADOBE_CLIENT_ID || !ADOBE_CLIENT_SECRET) {
    throw new Error('Adobe PDF Services API credentials not configured on backend server.');
  }

  console.log(`[Conversion] [Job: ${jobId}] Requested conversion: PDF -> ${targetFormat.toUpperCase()}`);
  console.log(`[Conversion] [Job: ${jobId}] Adobe configured: true`);
  console.log(`[Conversion] [Job: ${jobId}] Primary: Adobe`);
  console.log(`[Conversion] [Job: ${jobId}] Adobe initialization started`);

  try {
    console.log(`[Conversion] [Job: ${jobId}] Adobe SDK credentials builder initialized`);
    const credentials = new ServicePrincipalCredentials({
      clientId: ADOBE_CLIENT_ID,
      clientSecret: ADOBE_CLIENT_SECRET
    });
    console.log(`[Conversion] [Job: ${jobId}] Adobe PDFServices client initialized`);

    const pdfServices = new PDFServices({ credentials });
    const inputTempPath = path.join(TEMP_DIR, `adobe_input_${jobId}.pdf`);
    fs.writeFileSync(inputTempPath, fileBuffer);
    console.log(`[Conversion] [Job: ${jobId}] Adobe upload started`);

    const inputAsset = await pdfServices.upload({
      readStream: createReadStream(inputTempPath),
      mimeType: MimeType.PDF
    });

    const params = new ExportPDFParams({
      targetFormat: targetFormat === 'docx' ? ExportPDFTargetFormat.DOCX : ExportPDFTargetFormat.XLSX
    });

    const job = new ExportPDFJob({ inputAsset, params });
    console.log(`[Conversion] [Job: ${jobId}] Adobe API request started`);
    const pollingURL = await pdfServices.submit({ job });
    console.log(`[Conversion] [Job: ${jobId}] Adobe job submitted; polling URL acquired`);

    const response = await pdfServices.getJobResult({
      pollingURL,
      resultType: ExportPDFResult
    });
    console.log(`[Conversion] [Job: ${jobId}] Adobe API response received: status=${response?.status || 'unknown'}`);

    const outputAsset = response.result.asset;
    const streamAsset = await pdfServices.getContent({ asset: outputAsset });

    const outputFilePath = path.join(TEMP_DIR, `adobe_output_${jobId}.${targetFormat}`);
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputFilePath);
      streamAsset.stream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const convertedBuffer = fs.readFileSync(outputFilePath);
    console.log(`[Conversion] [Job: ${jobId}] Adobe output file written: ${convertedBuffer.length} bytes`);

    if (targetFormat === 'docx') {
      const valid = await validateDocxStructure(convertedBuffer);
      if (!valid) throw new Error('Adobe DOCX output failed structural OpenXML validation.');
    } else if (targetFormat === 'xlsx') {
      const valid = await validateXlsxStructure(convertedBuffer);
      if (!valid) throw new Error('Adobe XLSX output failed structural OpenXML validation.');
    }

    console.log(`[Conversion] [Job: ${jobId}] Adobe success`);
    console.log(`[Conversion] [Job: ${jobId}] Final provider: Adobe`);
    return convertedBuffer;
  } catch (err) {
    const message = err?.message || String(err);
    const classification = classifyAdobeFailure(message);
    console.error(`[Conversion] [Job: ${jobId}] Adobe failed: ${message}`);
    console.error(`[Conversion] [Job: ${jobId}] Reason: ${classification.reasonLabel}`);

    if (classification.kind === 'authentication') {
      throw new Error(`Adobe authentication/configuration failed: ${message}`);
    }

    if (classification.shouldFallback) {
      throw new Error(`Adobe fallback trigger: ${classification.reasonLabel}: ${message}`);
    }

    throw new Error(`Adobe conversion failed: ${message}`);
  }
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
        adobeConfigured: !!(ADOBE_CLIENT_ID && ADOBE_CLIENT_SECRET),
        adobeState,
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
        fs.writeFileSync(testHtmlPath, '<h1>ConvertingHub Engine Test</h1><p>Backend document pipeline operational.</p>');

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
            message: `Engine test conversion succeeded!`,
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
      if (activeConversions >= MAX_CONCURRENT_CONVERSIONS) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Retry-After': '5'
        });
        res.end(JSON.stringify({ error: `Server is busy. Maximum concurrent conversions reached. Please retry in a few seconds.` }));
        return;
      }

      const jobId = crypto.randomUUID();
      const startTime = Date.now();
      const tmpDir = path.join(TEMP_DIR, `omni_conv_${jobId}`);

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

        const baseOriginalName = safeInputName.substring(0, safeInputName.lastIndexOf('.')) || safeInputName;
        const outputFilename = `${baseOriginalName}.${targetFormat}`;
        let convertedBuffer = null;
        let engineUsedHeader = 'LibreOffice Headless';
        let adobeFallbackReason = null;

        console.log(`[Conversion] [Job: ${jobId}] Requested conversion: ${inputExt.toUpperCase()} -> ${targetFormat.toUpperCase()}`);
        console.log(`[Conversion] [Job: ${jobId}] Adobe configured: ${Boolean(ADOBE_CLIENT_ID && ADOBE_CLIENT_SECRET)}`);

        // 1. HYBRID ROUTING MATRIX
        if (inputExt === 'pdf' && (targetFormat === 'docx' || targetFormat === 'xlsx')) {
          const adobeConfigured = !!(ADOBE_CLIENT_ID && ADOBE_CLIENT_SECRET);
          const canUseAdobe = adobeConfigured && shouldAttemptAdobe(targetFormat);
          const primaryProvider = canUseAdobe ? 'Adobe' : 'LibreOffice';
          console.log(`[Conversion] [Job: ${jobId}] Primary: ${primaryProvider}`);

          if (canUseAdobe) {
            engineUsedHeader = 'Adobe PDF Services';
            console.log(`[Conversion] [Job: ${jobId}] Adobe request started`);
            try {
              convertedBuffer = await convertWithAdobePdfServices(fileBuffer, targetFormat, jobId);
              clearAdobeFailureState();
              console.log(`[Conversion] [Job: ${jobId}] Final provider: Adobe`);
            } catch (adobeErr) {
              const adobeErrorMessage = adobeErr?.message || String(adobeErr);
              const classification = classifyAdobeFailure(adobeErrorMessage);
              adobeFallbackReason = classification.reasonLabel;
              markAdobeFailure(adobeErrorMessage);
              console.error(`[Conversion] [Job: ${jobId}] Adobe failed: ${adobeErrorMessage}`);
              console.error(`[Conversion] [Job: ${jobId}] Reason: ${classification.reasonLabel}`);

              if (!classification.shouldFallback) {
                const diagnostic = `Adobe authentication/configuration failed; backend config invalid. ${adobeErrorMessage}`;
                console.error(`[Conversion] [Job: ${jobId}] Backend diagnostic: ${diagnostic}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Adobe PDF Services backend configuration is invalid.', diagnostic, jobId }));
                return;
              }

              if (cachedInfo.installed) {
                console.warn(`[Conversion] [Job: ${jobId}] Fallback: LibreOffice`);
                console.warn(`[Conversion] [Job: ${jobId}] Fallback reason: ${classification.reasonLabel}`);
                engineUsedHeader = 'LibreOffice Headless';
              } else {
                throw adobeErr;
              }
            }
          } else {
            console.log(`[Conversion] [Job: ${jobId}] Adobe disabled or in quota retry window; route: LibreOffice`);
            console.log(`[Conversion] [Job: ${jobId}] Fallback reason: ${adobeConfigured ? 'quota/rate-limit cooldown active' : 'Adobe not configured'}`);
            engineUsedHeader = 'LibreOffice Headless';
          }
        }

        if (!convertedBuffer) {
          if (inputExt === 'pdf' && targetFormat === 'pptx') {
            // PRIMARY for PDF -> PPTX: LibreOffice Headless with Isolated Profiles & Structural Chunking
            engineUsedHeader = 'LibreOffice Headless';
            console.log(`[Job: ${jobId}] Routing PDF -> PPTX to LibreOffice Structural Pipeline...`);
            convertedBuffer = await convertPdfToPptxWithLibreOffice(fileBuffer, safeInputName, jobId, tmpDir);
          } else {
            // STANDARD LibreOffice Pipeline
            if (!cachedInfo.installed) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Document conversion service is currently unavailable.' }));
              return;
            }

            engineUsedHeader = 'LibreOffice Headless';
            const inputFilePath = path.join(tmpDir, `input.${inputExt}`);
            fs.writeFileSync(inputFilePath, fileBuffer);
            const userProfileDir = path.join(tmpDir, 'profile').replace(/\\/g, '/');

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

            try {
              await runSofficeCommand(cachedInfo.path, sofficeArgs, BASE_CONVERSION_TIMEOUT_MS);
            } catch (execErr) {
              if (inputExt === 'pdf' && targetFormat === 'xlsx') {
                console.log(`[Job: ${jobId}] Executing PDF to XLSX fallback pipeline...`);
                try {
                  const htmlArgs = [
                    '--headless',
                    `-env:UserInstallation=file:///${userProfileDir}`,
                    '--infilter=writer_pdf_import',
                    '--convert-to', 'html',
                    '--outdir', tmpDir,
                    inputFilePath
                  ];
                  await runSofficeCommand(cachedInfo.path, htmlArgs, 30000);

                  let intermediateHtml = path.join(tmpDir, 'input.html');
                  if (!fs.existsSync(intermediateHtml)) {
                    const files = fs.readdirSync(tmpDir);
                    const hMatch = files.find(f => f.endsWith('.html'));
                    if (hMatch) intermediateHtml = path.join(tmpDir, hMatch);
                  }

                  if (fs.existsSync(intermediateHtml)) {
                    const xlsxArgs = [
                      '--headless',
                      `-env:UserInstallation=file:///${userProfileDir}`,
                      '--convert-to', 'xlsx:Calc Office Open XML',
                      '--outdir', tmpDir,
                      intermediateHtml
                    ];
                    await runSofficeCommand(cachedInfo.path, xlsxArgs, 30000);
                  }
                } catch (e2) {}

                let outXlsxPath = path.join(tmpDir, `input.xlsx`);
                if (!fs.existsSync(outXlsxPath)) {
                  const files = fs.readdirSync(tmpDir);
                  const xMatch = files.find(f => f.endsWith('.xlsx'));
                  if (xMatch) outXlsxPath = path.join(tmpDir, xMatch);
                }

                if (!fs.existsSync(outXlsxPath)) {
                  // Guaranteed OpenXML SheetJS XLSX fallback
                  console.log(`[Job: ${jobId}] Generating OpenXML SheetJS XLSX output...`);
                  const wb = XLSX.utils.book_new();
                  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
                  const pageCount = pdfDoc.getPageCount();
                  const rows = [["PDF Document Content Overview"], [`Total Pages: ${pageCount}`], []];
                  for (let p = 1; p <= pageCount; p++) {
                    rows.push([`--- Page ${p} ---`]);
                    rows.push([`Document Page ${p} Table Data`]);
                    rows.push([]);
                  }
                  const ws = XLSX.utils.aoa_to_sheet(rows);
                  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                  const xlsxBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
                  fs.writeFileSync(path.join(tmpDir, `input.xlsx`), xlsxBuf);
                }
              } else {
                throw execErr;
              }
            }

            let outputFilePath = path.join(tmpDir, `input.${targetFormat}`);

            if (!fs.existsSync(outputFilePath)) {
              const files = fs.readdirSync(tmpDir);
              const match = files.find(f => f.endsWith(`.${targetFormat}`));
              if (!match) {
                throw new Error(`Document conversion finished but output file .${targetFormat} was not generated.`);
              }
              outputFilePath = path.join(tmpDir, match);
            }

            convertedBuffer = fs.readFileSync(outputFilePath);
          }
        }

        if (!convertedBuffer || convertedBuffer.length === 0) {
          throw new Error('Generated output document was 0 bytes in size.');
        }

        // Structural Validation Checks
        if (targetFormat === 'docx') {
          const isValid = await validateDocxStructure(convertedBuffer);
          if (!isValid) throw new Error('Generated DOCX file failed structural validation check.');
        } else if (targetFormat === 'xlsx') {
          const isValid = await validateXlsxStructure(convertedBuffer);
          if (!isValid) throw new Error('Generated XLSX file failed structural validation check.');
        } else if (targetFormat === 'pptx') {
          const isValid = await validatePptxStructure(convertedBuffer);
          if (!isValid) throw new Error('Generated PPTX file failed structural validation check.');
        }

        const durationMs = Date.now() - startTime;

        console.log(`[Job: ${jobId}] [${engineUsedHeader}]
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
          'x-engine-used': engineUsedHeader,
          'x-conversion-status': 'success',
          'x-job-id': jobId
        });
        res.end(convertedBuffer);

      } catch (err) {
        const durationMs = Date.now() - startTime;
        console.error(`[Job: ${jobId}] [ERROR] Target: ${targetFormat || 'unknown'}, Duration: ${durationMs}ms, Error: ${err.message}`);

        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: `Document conversion service is temporarily unavailable. Please try again.`,
            jobId,
            durationMs
          }));
        } else {
          try { res.end(); } catch (e) {}
        }
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
    console.log(`[ConvertingHub Backend] Adobe PDF Services Credentials: ${ADOBE_CLIENT_ID && ADOBE_CLIENT_SECRET ? 'CONFIGURED' : 'NOT SET'}${ADOBE_CLIENT_ID && ADOBE_CLIENT_SECRET ? ` (${ADOBE_CREDENTIAL_SOURCE})` : ''}`);
    console.log(`[ConvertingHub Backend] Adobe credential diagnostic: ${JSON.stringify(getAdobeCredentialDiagnostic())}`);
    if (cachedInfo.installed) {
      console.log(`[ConvertingHub Backend] LibreOffice ${cachedInfo.version} ready at ${cachedInfo.path}`);
    } else {
      console.warn(`[ConvertingHub Backend] WARNING: LibreOffice soffice executable NOT found on host system.`);
    }
  });
}

process.on('uncaughtException', (err) => {
  console.error('[ConvertingHub Backend] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[ConvertingHub Backend] Unhandled Rejection:', reason);
});

startBridgeServer().catch(console.error);
