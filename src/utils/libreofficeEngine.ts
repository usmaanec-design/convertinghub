import * as XLSX from 'xlsx';
import { Document, Paragraph, TextRun, Packer, ImageRun } from 'docx';
import pptxgen from 'pptxgenjs';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

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
}

export interface ConversionResult {
  blob: Blob | null;
  engineUsed: 'LibreOffice Headless' | 'PDF Layout Extraction Engine' | 'PDF Table Extraction Engine';
  filename: string;
  success: boolean;
  error?: string;
  durationMs?: number;
}

const customBridgeUrl = import.meta.env.VITE_BRIDGE_URL;
const BASE_URLS = [
  ...(customBridgeUrl
    ? [customBridgeUrl.endsWith('/api/libreoffice') ? customBridgeUrl : customBridgeUrl.replace(/\/$/, '')]
    : []),
  '/api/libreoffice',
  '/api',
  'http://127.0.0.1:3001/api/libreoffice',
  'http://127.0.0.1:3001/api',
  'http://127.0.0.1:3001'
];

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
        const targetUrl = baseUrl.endsWith('/status') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/status`;
        const res = await fetch(targetUrl, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          if (data && (typeof data.installed === 'boolean' || typeof data.libreoffice === 'boolean')) {
            const installed = Boolean(data.installed ?? data.libreoffice);
            return {
              installed,
              version: data.version || 'Installed',
              path: data.path || 'Server Container',
              status: installed ? 'connected' : 'not_installed'
            };
          }
        }
      } catch (e) {}
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
        const targetUrl = baseUrl.endsWith('/test') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/test`;
        const res = await fetch(targetUrl, {
          method: 'POST',
          signal: AbortSignal.timeout(12000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            return {
              success: true,
              message: `Engine test passed! LibreOffice executed successfully in ${data.durationMs}ms.`
            };
          }
          return { success: false, message: data.error || 'Engine execution failed.' };
        }
      } catch (e: any) {
        console.warn(`[ConvertingHub Engine] Test failed on ${baseUrl}: ${e.message}`);
      }
    }

    return { success: false, message: 'Could not connect to conversion backend server.' };
  }

  public async convertDocument(
    file: File,
    targetFormat: string,
    options?: ConversionOptions
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const cleanTargetFormat = targetFormat.toLowerCase().replace('.', '');
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const outputFilename = `${baseName}.${cleanTargetFormat}`;
    const arrayBuffer = await file.arrayBuffer();

    // 1. Try LibreOffice Headless via Backend Service (Primary Engine)
    for (const baseUrl of BASE_URLS) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetFormat', cleanTargetFormat);
        if (options?.sheetMode) {
          formData.append('sheetMode', options.sheetMode);
        }

        const convertUrl = baseUrl.endsWith('/convert') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/convert`;

        const response = await fetch(convertUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'x-target-format': cleanTargetFormat,
            'x-input-name': file.name
          },
          signal: AbortSignal.timeout(120000) // 120s timeout for large multi-page documents
        });

        if (response.ok) {
          const blob = await response.blob();
          if (blob && blob.size > 0) {
            const durationMs = Date.now() - startTime;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('toolUsageCompleted'));
            }
            return {
              blob,
              engineUsed: 'LibreOffice Headless',
              filename: outputFilename,
              success: true,
              durationMs
            };
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(`[ConvertingHub Engine] Backend call to ${convertUrl} returned status ${response.status}:`, errData);
        }
      } catch (e: any) {
        console.warn(`[ConvertingHub Engine] Backend call to ${baseUrl} failed: ${e.message}`);
      }
    }

    // 2. Client-Side Fallback behavior check
    if (options?.sheetMode === undefined && !options?.allowClientFallback) {
      const durationMs = Date.now() - startTime;
      return {
        blob: null,
        engineUsed: 'LibreOffice Headless',
        filename: outputFilename,
        success: false,
        error: 'Document conversion service is temporarily unavailable. Please try again.',
        durationMs
      };
    }

    console.warn('[ConvertingHub Engine] Backend unavailable. Falling back to client-side extraction engine.');

    if (cleanTargetFormat === 'docx') {
      const docxBlob = await this.extractPdfToDocx(arrayBuffer);
      const durationMs = Date.now() - startTime;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('toolUsageCompleted'));
      }
      return {
        blob: docxBlob,
        engineUsed: 'PDF Layout Extraction Engine',
        filename: outputFilename,
        success: true,
        durationMs
      };
    }

    if (cleanTargetFormat === 'pptx') {
      const pptxBlob = await this.extractPdfToPptx(arrayBuffer);
      const durationMs = Date.now() - startTime;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('toolUsageCompleted'));
      }
      return {
        blob: pptxBlob,
        engineUsed: 'PDF Layout Extraction Engine',
        filename: outputFilename,
        success: true,
        durationMs
      };
    }

    if (cleanTargetFormat === 'xlsx') {
      const sheetMode = (options && options.sheetMode) || 'single';
      const xlsxBlob = await this.extractPdfToXlsx(arrayBuffer, sheetMode);
      const durationMs = Date.now() - startTime;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('toolUsageCompleted'));
      }
      return {
        blob: xlsxBlob,
        engineUsed: 'PDF Table Extraction Engine',
        filename: outputFilename,
        success: true,
        durationMs
      };
    }

    const durationMs = Date.now() - startTime;
    return {
      blob: null,
      engineUsed: 'LibreOffice Headless',
      filename: outputFilename,
      success: false,
      error: 'Document conversion service is temporarily unavailable. Please try again.',
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
            slide.addImage({ data: imgDataUrl, x: 0, y: 0, w: '100%', h: '100%' });
            renderedCanvas = true;
          }
        } catch (e) {
          console.warn(`[ConvertingHub Engine] Canvas page render failed for slide ${pageNum}:`, e);
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
          slide.addText(`Slide ${pageNum}`, { x: 1, y: 1, w: 6, h: 1, fontSize: 18, color: '7F8C8D' });
        }
      }
    }

    const pptxBuffer = (await pres.write({ outputType: 'arraybuffer' })) as ArrayBuffer;
    return new Blob([pptxBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
  }

  /**
   * PDF Table Extraction Engine: Supports Single Sheet & Multiple Sheets
   */
  private async extractPdfToXlsx(pdfArrayBuffer: ArrayBuffer, sheetMode: 'single' | 'multiple'): Promise<Blob> {
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
    const numPages = pdfDoc.numPages;
    const wb = XLSX.utils.book_new();

    if (sheetMode === 'multiple') {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageRows = this.parsePageTextToRows(textContent.items);
        const ws = XLSX.utils.aoa_to_sheet(pageRows.length > 0 ? pageRows : [[`Page ${pageNum} Content`]]);
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

      const ws = XLSX.utils.aoa_to_sheet(combinedRows.length > 0 ? combinedRows : [['PDF Content']]);
      XLSX.utils.book_append_sheet(wb, ws, 'All PDF Pages');
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
          console.warn(`[ConvertingHub Engine] Canvas page render failed for DOCX page ${pageNum}:`, e);
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
