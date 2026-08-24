import { createWorker } from 'tesseract.js';
import { PdfTextItem } from './pdfEditorTypes';

export interface OcrResultItem {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}

export async function performPageOcr(
  canvas: HTMLCanvasElement,
  pageIndex: number,
  scaleFactor: number = 1.0,
  onProgress?: (pct: number) => void
): Promise<PdfTextItem[]> {
  try {
    const worker = await createWorker('eng');

    const dataUrl = canvas.toDataURL('image/png');
    const ret = await worker.recognize(dataUrl);

    await worker.terminate();

    const textItems: PdfTextItem[] = [];

    const data = ret?.data as any;
    if (data && data.words) {
      data.words.forEach((word: any, idx: number) => {
        if (word.text && word.text.trim().length > 0 && word.confidence > 40) {
          const { x0, y0, x1, y1 } = word.bbox;
          const width = (x1 - x0) / scaleFactor;
          const height = (y1 - y0) / scaleFactor;
          const x = x0 / scaleFactor;
          const y = y0 / scaleFactor;

          textItems.push({
            id: `ocr_text_${pageIndex}_${idx}_${Date.now()}`,
            text: word.text.trim(),
            x,
            y,
            width: Math.max(width, 20),
            height: Math.max(height, 12),
            fontSize: Math.max(Math.round(height * 0.8), 10),
            fontFamily: 'Helvetica',
            color: '#000000',
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
            alignment: 'left',
            rotation: 0,
            opacity: 1,
            pageIndex,
            isOriginal: true
          });
        }
      });
    }

    return textItems;
  } catch (err) {
    console.warn('OCR processing fallback:', err);
    return [];
  }
}
