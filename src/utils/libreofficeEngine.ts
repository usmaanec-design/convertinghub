import * as XLSX from 'xlsx';
import { Document, Paragraph, TextRun, Packer, ImageRun } from 'docx';
import pptxgen from 'pptxgenjs';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';
import { dispatchConversionSuccess } from './conversionTracker';
import { getClientTrialId } from './entitlementManager';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface LibreOfficeStatus {
  installed: boolean;
  version: string | null;
  path: string | null;
  status: 'connected' | 'not_installed' | 'bridge_down';
}

export interface ConversionOptions {
  sheetMode?: 'single' | 'multiple';
  allowClientFallback?: boolean;
  onStatusChange?: (statusMessage: string) => void;
  signal?: AbortSignal;
  userId?: string;
  authToken?: string;
}

export interface ConversionResult {
  blob: Blob | null;
  engineUsed: 'primary' | 'backup' | 'client';
  filename: string;
  success: boolean;
  error?: string;
  durationMs?: number;
  tokensRemaining?: number;
}

const PRODUCTION_BACKEND_URL = 'https://convertinghub-backend.onrender.com';

const customBridgeUrl =
  import.meta.env.VITE_BRIDGE_URL || import.meta.env.VITE_BACKEND_URL;

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

export const BASE_URLS = Array.from(
  new Set(
    [
      ...(customBridgeUrl
        ? [
            customBridgeUrl.replace(/\/$/, ''),
            customBridgeUrl.endsWith('/api/libreoffice')
              ? customBridgeUrl
              : `${customBridgeUrl.replace(/\/$/, '')}/api/libreoffice`,
            customBridgeUrl.endsWith('/api')
              ? customBridgeUrl
              : `${customBridgeUrl.replace(/\/$/, '')}/api`
          ]
        : []),
      `${PRODUCTION_BACKEND_URL}/api/libreoffice`,
      `${PRODUCTION_BACKEND_URL}/api`,
      PRODUCTION_BACKEND_URL,
      ...(isLocalhost
        ? [
            '/api/libreoffice',
            '/api',
            'http://127.0.0.1:3001/api/libreoffice',
            'http://127.0.0.1:3001/api',
            'http://127.0.0.1:3001'
          ]
        : [])
    ].filter(Boolean)
  )
);

export class LibreOfficeEngine {
  private static instance: LibreOfficeEngine;

  public static getInstance(): LibreOfficeEngine {
    if (!LibreOfficeEngine.instance) {
      LibreOfficeEngine.instance = new LibreOfficeEngine();
    }
    return LibreOfficeEngine.instance;
  }

  public async getStatus(): Promise<LibreOfficeStatus> {
    for (const baseUrl of BASE_URLS) {
      try {
        const targetUrl = baseUrl.endsWith('/status')
          ? baseUrl
          : `${baseUrl.replace(/\/$/, '')}/status`;
        const res = await fetch(targetUrl, {
          signal: AbortSignal.timeout(8000)
        });
        if (res.ok) {
          const data = await res.json();
          if (
            data &&
            (typeof data.installed === 'boolean' ||
              typeof data.libreoffice === 'boolean')
          ) {
            const installed = Boolean(data.installed ?? data.libreoffice);
            return {
              installed,
              version: data.version || 'Installed',
              path: data.path || 'Server Container',
              status: installed ? 'connected' : 'not_installed'
            };
          }
        }
      } catch (e) {
        // Continue checking other base URLs if ping fails
      }
    }

    return {
      installed: false,
      version: null,
      path: null,
      status: 'bridge_down'
    };
  }

  public async testEngine(): Promise<{ success: boolean; message: string }> {
    for (const baseUrl of BASE_URLS) {
      try {
        const targetUrl = baseUrl.endsWith('/test')
          ? baseUrl
          : `${baseUrl.replace(/\/$/, '')}/test`;
        const res = await fetch(targetUrl, {
          method: 'POST',
          signal: AbortSignal.timeout(15000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            return {
              success: true,
              message: `Engine test passed! LibreOffice executed successfully in ${data.durationMs}ms.`
            };
          }
          return {
            success: false,
            message: data.error || 'Engine execution failed.'
          };
        }
      } catch (e: any) {
        console.warn(
          `[ConvertingHub Engine] Test failed on ${baseUrl}: ${e.message}`
        );
      }
    }

    return {
      success: false,
      message: 'Could not connect to conversion backend server.'
    };
  }

  /**
   * Pre-flight backend warm-up ping strategy.
   * Polls GET /health until backend returns 200 OK + healthy status JSON or 60s timeout elapses.
   */
  private async ensureBackendReady(
    onStatusChange?: (statusMessage: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const startTime = Date.now();
    const maxWaitMs = 60000; // 60 seconds maximum warm-up duration
    const pollIntervalMs = 4000; // 4 seconds polling interval

    let attempts = 0;

    // 1. Immediate fast check across endpoints
    for (const baseUrl of BASE_URLS) {
      if (signal?.aborted) {
        throw new Error('Conversion cancelled by user.');
      }
      attempts++;
      const healthUrl = baseUrl.endsWith('/health')
        ? baseUrl
        : `${baseUrl.replace(/\/$/, '')}/health`;

      try {
        console.log(
          `[Conversion Warmup] health attempt=${attempts}, url=${healthUrl}`
        );
        const res = await fetch(healthUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(15000)
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            const data = await res.json().catch(() => ({}));
            if (
              data.status === 'ok' &&
              (data.installed === true || data.libreoffice === true) &&
              (data.adobeConfigured === undefined ||
                data.adobeConfigured === true)
            ) {
              console.log(
                `[Conversion Warmup] backend ready immediately after ${
                  (Date.now() - startTime) / 1000
                }s`
              );
              return baseUrl;
            }
          }
        }
      } catch (e: any) {
        if (signal?.aborted) {
          throw new Error('Conversion cancelled by user.');
        }
        console.warn(
          `[Conversion Warmup] Initial health check failed on ${baseUrl}: ${e.message}`
        );
      }
    }

    // 2. Progressive warm-up polling if Render backend is sleeping
    const primaryBaseUrl = BASE_URLS[0] || PRODUCTION_BACKEND_URL;
    const primaryHealthUrl = primaryBaseUrl.endsWith('/health')
      ? primaryBaseUrl
      : `${primaryBaseUrl.replace(/\/$/, '')}/health`;

    onStatusChange?.('Waking up conversion server...');

    while (Date.now() - startTime < maxWaitMs) {
      if (signal?.aborted) {
        throw new Error('Conversion cancelled by user.');
      }

      attempts++;
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      onStatusChange?.(`Conversion server is starting... ${elapsedSec}s`);
      console.log(
        `[Conversion Warmup] backend not ready, retrying in 4s (elapsed ${elapsedSec}s)`
      );

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      if (signal?.aborted) {
        throw new Error('Conversion cancelled by user.');
      }

      try {
        console.log(
          `[Conversion Warmup] health attempt=${attempts}, url=${primaryHealthUrl}`
        );
        const res = await fetch(primaryHealthUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(8000)
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            const data = await res.json().catch(() => ({}));
            if (
              data.status === 'ok' &&
              (data.installed === true || data.libreoffice === true)
            ) {
              const totalElapsedSec = ((Date.now() - startTime) / 1000).toFixed(
                1
              );
              console.log(
                `[Conversion Warmup] backend ready after ${totalElapsedSec}s`
              );
              onStatusChange?.(
                'Conversion server ready. Starting conversion...'
              );
              return primaryBaseUrl;
            }
          }
        }
      } catch (e: any) {
        if (signal?.aborted) {
          throw new Error('Conversion cancelled by user.');
        }
        console.warn(`[Conversion Warmup] health request failed: ${e.message}`);
      }
    }

    throw new Error(
      'Conversion server is taking longer than expected to start. Please try again in a moment.'
    );
  }

  public async convertDocument(
    file: File,
    targetFormat: string,
    options?: ConversionOptions
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const cleanTargetFormat = targetFormat.toLowerCase().replace('.', '');
    const baseName =
      file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const outputFilename = `${baseName}.${cleanTargetFormat}`;
    const arrayBuffer = await file.arrayBuffer();

    let readyBaseUrl = '';
    let warmupErrorMsg = '';

    try {
      options?.onStatusChange?.('Preparing conversion server...');
      readyBaseUrl = await this.ensureBackendReady(
        options?.onStatusChange,
        options?.signal
      );
    } catch (warmupError: any) {
      warmupErrorMsg =
        warmupError.message ||
        'Conversion server is taking longer than expected to start. Please try again in a moment.';
      console.warn(`[ConvertingHub Engine] Warmup failed: ${warmupErrorMsg}`);
    }

    if (readyBaseUrl) {
      const convertUrl = readyBaseUrl.endsWith('/convert')
        ? readyBaseUrl
        : `${readyBaseUrl.replace(/\/$/, '')}/convert`;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetFormat', cleanTargetFormat);
        if (options?.sheetMode) {
          formData.append('sheetMode', options.sheetMode);
        }

        console.log(
          `[Conversion] sending conversion request endpoint=${convertUrl}, target=${cleanTargetFormat}, fileSize=${file.size}`
        );
        options?.onStatusChange?.('Converting your document...');

        const reqHeaders: Record<string, string> = {
          'x-target-format': cleanTargetFormat,
          'x-input-name': encodeURIComponent(file.name),
          'x-client-trial-id': getClientTrialId()
        };

        if (options?.userId) {
          reqHeaders['x-user-id'] = options.userId;
        }

        if (options?.authToken) {
          reqHeaders['authorization'] = `Bearer ${options.authToken}`;
        } else if (options?.userId) {
          reqHeaders['authorization'] = `Bearer ${options.userId}`;
        }

        const response = await fetch(convertUrl, {
          method: 'POST',
          body: formData,
          headers: reqHeaders,
          signal: AbortSignal.timeout(120000) // 120s timeout for single file conversion
        });

        const contentType = response.headers.get('content-type') || '';
        const tokensRemainingHeader = response.headers.get('x-tokens-remaining');
        const tokensRemaining = tokensRemainingHeader !== null ? parseInt(tokensRemainingHeader, 10) : undefined;

        console.log(
          `[Conversion] conversion response status=${
            response.status
          }, contentType=${contentType}, elapsedMs=${Date.now() - startTime}`
        );

        if (response.ok) {
          if (!contentType.includes('text/html')) {
            const blob = await response.blob();
            if (blob && blob.size > 0) {
              const durationMs = Date.now() - startTime;
              dispatchConversionSuccess();
              options?.onStatusChange?.('Conversion completed successfully.');
              return {
                blob,
                engineUsed: 'primary',
                filename: outputFilename,
                success: true,
                durationMs,
                tokensRemaining
              };
            }
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(
            `[Conversion] Backend call to ${convertUrl} returned status ${response.status}:`,
            errData
          );
          if (
            options?.sheetMode === undefined &&
            !options?.allowClientFallback
          ) {
            return {
              blob: null,
              engineUsed: 'primary',
              filename: outputFilename,
              success: false,
              error:
                errData.error ||
                `Server conversion error (status ${response.status}). Please verify your document and try again.`,
              durationMs: Date.now() - startTime
            };
          }
        }
      } catch (e: any) {
        console.warn(
          `[Conversion] Backend call to ${convertUrl} failed: ${e.message}`
        );
        if (options?.sheetMode === undefined && !options?.allowClientFallback) {
          return {
            blob: null,
            engineUsed: 'primary',
            filename: outputFilename,
            success: false,
            error:
              options?.signal?.aborted || e.name === 'AbortError'
                ? 'Conversion cancelled by user.'
                : `Network error connecting to conversion server. Please check your internet connection and try again.`,
            durationMs: Date.now() - startTime
          };
        }
      }
    }

    // 2. Client-Side Fallback behavior check
    if (options?.sheetMode === undefined && !options?.allowClientFallback) {
      const durationMs = Date.now() - startTime;
      return {
        blob: null,
        engineUsed: 'primary',
        filename: outputFilename,
        success: false,
        error:
          warmupErrorMsg ||
          'Document conversion service is temporarily unavailable. Please try again.',
        durationMs
      };
    }

    console.warn(
      '[ConvertingHub Engine] Backend unavailable. Falling back to client-side extraction engine.'
    );

    if (cleanTargetFormat === 'docx') {
      const docxBlob = await this.extractPdfToDocx(arrayBuffer);
      const durationMs = Date.now() - startTime;
      dispatchConversionSuccess();
      return {
        blob: docxBlob,
        engineUsed: 'client',
        filename: outputFilename,
        success: true,
        durationMs
      };
    }

    if (cleanTargetFormat === 'pptx') {
      const pptxBlob = await this.extractPdfToPptx(arrayBuffer);
      const durationMs = Date.now() - startTime;
      dispatchConversionSuccess();
      return {
        blob: pptxBlob,
        engineUsed: 'client',
        filename: outputFilename,
        success: true,
        durationMs
      };
    }

    if (cleanTargetFormat === 'xlsx') {
      const sheetMode = (options && options.sheetMode) || 'single';
      const xlsxBlob = await this.extractPdfToXlsx(arrayBuffer, sheetMode);
      const durationMs = Date.now() - startTime;
      dispatchConversionSuccess();
      return {
        blob: xlsxBlob,
        engineUsed: 'client',
        filename: outputFilename,
        success: true,
        durationMs
      };
    }

    const durationMs = Date.now() - startTime;
    return {
      blob: null,
      engineUsed: 'primary',
      filename: outputFilename,
      success: false,
      error:
        'Document conversion service is temporarily unavailable. Please try again.',
      durationMs
    };
  }

  /**
   * PDF Presentation Extraction Engine (PPTX) using pptxgenjs
   */
  private async extractPdfToPptx(pdfArrayBuffer: ArrayBuffer): Promise<Blob> {
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
    const numPages = pdfDoc.numPages;
    const pres = new pptxgen();

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const slide = pres.addSlide();

      let renderedCanvas = false;
      if (typeof document !== 'undefined') {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            slide.addImage({
              data: imgDataUrl,
              x: 0,
              y: 0,
              w: '100%',
              h: '100%'
            });
            renderedCanvas = true;
          }
        } catch (e) {
          console.warn(
            `[ConvertingHub Engine] Canvas page render failed for slide ${pageNum}:`,
            e
          );
        }
      }

      if (!renderedCanvas) {
        const textContent = await page.getTextContent();
        const pageRows = this.parsePageTextToRows(textContent.items);

        let yPos = 0.6;
        pageRows.forEach((row) => {
          const lineText = row.join(' ');
          if (lineText.trim() && yPos < 6.8) {
            slide.addText(lineText, {
              x: 0.6,
              y: yPos,
              w: 8.8,
              h: 0.4,
              fontSize: 13,
              color: '2C3E50',
              fontFace: 'Calibri'
            });
            yPos += 0.45;
          }
        });

        if (pageRows.length === 0) {
          slide.addText(`Slide ${pageNum}`, {
            x: 1,
            y: 1,
            w: 6,
            h: 1,
            fontSize: 18,
            color: '7F8C8D'
          });
        }
      }
    }

    const pptxBuffer = (await pres.write({
      outputType: 'arraybuffer'
    })) as ArrayBuffer;
    return new Blob([pptxBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
  }

  /**
   * PDF Table Extraction Engine: Supports Single Sheet & Multiple Sheets
   */
  private async extractPdfToXlsx(
    pdfArrayBuffer: ArrayBuffer,
    sheetMode: 'single' | 'multiple'
  ): Promise<Blob> {
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
    const numPages = pdfDoc.numPages;
    const wb = XLSX.utils.book_new();

    if (sheetMode === 'multiple') {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageRows = this.parsePageTextToRows(textContent.items);
        const ws = XLSX.utils.aoa_to_sheet(
          pageRows.length > 0 ? pageRows : [[`Page ${pageNum} Content`]]
        );
        XLSX.utils.book_append_sheet(wb, ws, `Page ${pageNum}`);
      }
    } else {
      const combinedRows: string[][] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageRows = this.parsePageTextToRows(textContent.items);

        combinedRows.push([`--- PAGE ${pageNum} ---`]);
        if (pageRows.length > 0) {
          combinedRows.push(...pageRows);
        } else {
          combinedRows.push(['[Empty / Image Page]']);
        }
        combinedRows.push([]);
      }

      const ws = XLSX.utils.aoa_to_sheet(
        combinedRows.length > 0 ? combinedRows : [['PDF Content']]
      );
      XLSX.utils.book_append_sheet(wb, ws, 'All PDF Pages');
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  private parsePageTextToRows(items: any[]): string[][] {
    const rowsMap = new Map<number, { x: number; text: string }[]>();

    items.forEach((item: any) => {
      const x = Math.round(item.transform[4]);
      const y = Math.round(item.transform[5]);

      let targetY: number | null = null;
      for (const existingY of rowsMap.keys()) {
        if (Math.abs(existingY - y) <= 4) {
          targetY = existingY;
          break;
        }
      }

      if (targetY === null) {
        targetY = y;
        rowsMap.set(targetY, []);
      }

      rowsMap.get(targetY)!.push({ x, text: item.str.trim() });
    });

    const sortedY = Array.from(rowsMap.keys()).sort((a, b) => b - a);
    const pageRows: string[][] = [];

    sortedY.forEach((y) => {
      const rowItems = rowsMap.get(y)!;
      rowItems.sort((a, b) => a.x - b.x);
      const rowValues = rowItems.map((i) => i.text).filter(Boolean);
      if (rowValues.length > 0) {
        pageRows.push(rowValues);
      }
    });

    return pageRows;
  }

  /**
   * PDF Document Extraction Engine (DOCX) using docx.js
   */
  private async extractPdfToDocx(pdfArrayBuffer: ArrayBuffer): Promise<Blob> {
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
    const numPages = pdfDoc.numPages;
    const paragraphs: Paragraph[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });

      let renderedCanvas = false;
      if (typeof document !== 'undefined') {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const response = await fetch(dataUrl);
            const imgBuffer = await response.arrayBuffer();

            const aspectRatio = viewport.height / viewport.width;
            const targetWidth = 595;
            const targetHeight = Math.round(targetWidth * aspectRatio);

            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: new Uint8Array(imgBuffer),
                    transformation: {
                      width: targetWidth,
                      height: targetHeight
                    },
                    type: 'jpg'
                  })
                ],
                spacing: { after: 200 }
              })
            );
            renderedCanvas = true;
          }
        } catch (e) {
          console.warn(
            `[ConvertingHub Engine] Canvas page render failed for DOCX page ${pageNum}:`,
            e
          );
        }
      }

      if (!renderedCanvas) {
        const textContent = await page.getTextContent();
        const pageRows = this.parsePageTextToRows(textContent.items);

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Page ${pageNum}`,
                bold: true,
                size: 24,
                color: '2C3E50'
              })
            ],
            spacing: { before: 200, after: 120 }
          })
        );

        pageRows.forEach((rowValues) => {
          const lineText = rowValues.join(' ');
          if (lineText.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: lineText,
                    size: 22,
                    font: 'Calibri'
                  })
                ],
                spacing: { after: 100 }
              })
            );
          }
        });
      }

      if (pageNum < numPages) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            pageBreakBefore: true
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs
        }
      ]
    });

    return await Packer.toBlob(doc);
  }
}

export const libreOfficeEngine = LibreOfficeEngine.getInstance();
