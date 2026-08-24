import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  PDFPage
} from 'pdf-lib';
import {
  PdfPageObject,
  PdfTextItem,
  PdfShapeItem,
  PdfImageItem,
  PdfStampItem,
  PdfLinkItem,
  PdfNoteItem
} from './pdfEditorTypes';

export interface ExportPdfOptions {
  originalPdfBuffer: ArrayBuffer;
  pages: PdfPageObject[];
  textItems: Record<number, PdfTextItem[]>;
  shapeItems: Record<number, PdfShapeItem[]>;
  imageItems: Record<number, PdfImageItem[]>;
  stampItems?: Record<number, PdfStampItem[]>;
  linkItems?: Record<number, PdfLinkItem[]>;
  noteItems?: Record<number, PdfNoteItem[]>;
  whiteoutRects: Record<number, { x: number; y: number; width: number; height: number }[]>;
}

function hexToRgb(hex: string) {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return rgb(0, 0, 0);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

export async function exportModifiedPdf(options: ExportPdfOptions): Promise<Uint8Array> {
  const {
    originalPdfBuffer,
    pages,
    textItems,
    shapeItems,
    imageItems,
    stampItems = {},
    linkItems = {},
    noteItems = {},
    whiteoutRects
  } = options;

  // Load original PDF
  const srcDoc = await PDFDocument.load(originalPdfBuffer, { ignoreEncryption: true });
  const newPdfDoc = await PDFDocument.create();

  // Standard Font Embeds
  const fontHelvetica = await newPdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await newPdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontCourier = await newPdfDoc.embedFont(StandardFonts.Courier);

  const getFontObj = (fontName: string, isBold: boolean) => {
    if (isBold) return fontHelveticaBold;
    if (fontName.toLowerCase().includes('times')) return fontTimes;
    if (fontName.toLowerCase().includes('courier')) return fontCourier;
    return fontHelvetica;
  };

  // Iterate over configured pages in order
  for (let i = 0; i < pages.length; i++) {
    const pageMeta = pages[i];
    let pdfPage: PDFPage;

    if (pageMeta.pageIndex < srcDoc.getPageCount()) {
      const [copiedPage] = await newPdfDoc.copyPages(srcDoc, [pageMeta.pageIndex]);
      pdfPage = newPdfDoc.addPage(copiedPage);
    } else {
      // Add new blank page
      pdfPage = newPdfDoc.addPage([pageMeta.pdfPageWidth || 612, pageMeta.pdfPageHeight || 792]);
    }

    // Apply rotation
    if (pageMeta.rotation !== undefined && pageMeta.rotation !== 0) {
      pdfPage.setRotation(degrees(pageMeta.rotation));
    }

    const { height: pHeight } = pdfPage.getSize();

    // 1. Draw Whiteout Patches
    const wRects = whiteoutRects[pageMeta.pageIndex] || [];
    wRects.forEach((rect) => {
      pdfPage.drawRectangle({
        x: rect.x,
        y: pHeight - rect.y - rect.height,
        width: rect.width,
        height: rect.height,
        color: rgb(1, 1, 1),
        borderColor: rgb(1, 1, 1),
        borderWidth: 0
      });
    });

    // 2. Draw Shape Items
    const shapes = shapeItems[pageMeta.pageIndex] || [];
    shapes.forEach((shape) => {
      const fillRgb = hexToRgb(shape.fillColor || '#ffffff');
      const strokeRgb = hexToRgb(shape.strokeColor || '#000000');
      const pdfY = pHeight - shape.y - shape.height;

      if (shape.type === 'whiteout') {
        pdfPage.drawRectangle({
          x: shape.x,
          y: pdfY,
          width: shape.width,
          height: shape.height,
          color: rgb(1, 1, 1),
          opacity: shape.opacity ?? 1
        });
      } else if (shape.type === 'rectangle' || shape.type === 'highlight') {
        pdfPage.drawRectangle({
          x: shape.x,
          y: pdfY,
          width: shape.width,
          height: shape.height,
          color: shape.type === 'highlight' ? hexToRgb(shape.fillColor || '#ffff00') : fillRgb,
          borderColor: strokeRgb,
          borderWidth: shape.strokeWidth || 0,
          opacity: shape.type === 'highlight' ? (shape.opacity || 0.4) : (shape.opacity ?? 1)
        });
      } else if (shape.type === 'circle') {
        pdfPage.drawEllipse({
          x: shape.x + shape.width / 2,
          y: pHeight - shape.y - shape.height / 2,
          xScale: shape.width / 2,
          yScale: shape.height / 2,
          color: fillRgb,
          borderColor: strokeRgb,
          borderWidth: shape.strokeWidth || 0,
          opacity: shape.opacity ?? 1
        });
      } else if (shape.type === 'line' || shape.type === 'arrow') {
        pdfPage.drawLine({
          start: { x: shape.x, y: pHeight - shape.y },
          end: { x: shape.x + shape.width, y: pHeight - shape.y - shape.height },
          thickness: shape.strokeWidth || 2,
          color: strokeRgb,
          opacity: shape.opacity ?? 1
        });
      } else if (shape.type === 'checkmark') {
        pdfPage.drawText('✓', {
          x: shape.x,
          y: pdfY,
          size: Math.max(shape.height, 16),
          font: fontHelveticaBold,
          color: strokeRgb,
          opacity: shape.opacity ?? 1
        });
      } else if (shape.type === 'cross') {
        pdfPage.drawText('✗', {
          x: shape.x,
          y: pdfY,
          size: Math.max(shape.height, 16),
          font: fontHelveticaBold,
          color: strokeRgb,
          opacity: shape.opacity ?? 1
        });
      }
    });

    // 3. Draw Images & Signatures
    const imgs = imageItems[pageMeta.pageIndex] || [];
    for (const imgItem of imgs) {
      try {
        let embeddedImage;
        if (imgItem.dataUrl.startsWith('data:image/png')) {
          embeddedImage = await newPdfDoc.embedPng(imgItem.dataUrl);
        } else if (imgItem.dataUrl.startsWith('data:image/jpeg') || imgItem.dataUrl.startsWith('data:image/jpg')) {
          embeddedImage = await newPdfDoc.embedJpg(imgItem.dataUrl);
        } else {
          embeddedImage = await newPdfDoc.embedPng(imgItem.dataUrl);
        }

        const pdfY = pHeight - imgItem.y - imgItem.height;

        pdfPage.drawImage(embeddedImage, {
          x: imgItem.x,
          y: pdfY,
          width: imgItem.width,
          height: imgItem.height,
          opacity: imgItem.opacity ?? 1,
          rotate: degrees(imgItem.rotation || 0)
        });
      } catch (err) {
        console.warn('Failed embedding image into PDF:', err);
      }
    }

    // 4. Draw Stamps
    const stamps = stampItems[pageMeta.pageIndex] || [];
    stamps.forEach((stamp) => {
      const pdfY = pHeight - stamp.y - stamp.height;
      const borderRgb = hexToRgb(stamp.borderColor || '#16a34a');
      const bgRgb = hexToRgb(stamp.bgColor || '#f0fdf4');

      pdfPage.drawRectangle({
        x: stamp.x,
        y: pdfY,
        width: stamp.width,
        height: stamp.height,
        color: bgRgb,
        borderColor: borderRgb,
        borderWidth: 2,
        opacity: stamp.opacity ?? 0.95
      });

      pdfPage.drawText(stamp.label, {
        x: stamp.x + 8,
        y: pdfY + (stamp.height / 2) - 6,
        size: Math.max(Math.round(stamp.height * 0.4), 12),
        font: fontHelveticaBold,
        color: borderRgb,
        opacity: stamp.opacity ?? 1
      });
    });

    // 5. Draw Notes (Sticky Annotations)
    const notes = noteItems[pageMeta.pageIndex] || [];
    notes.forEach((note) => {
      const pdfY = pHeight - note.y - note.height;
      pdfPage.drawRectangle({
        x: note.x,
        y: pdfY,
        width: note.width,
        height: note.height,
        color: hexToRgb(note.color || '#fef08a'),
        borderColor: hexToRgb('#eab308'),
        borderWidth: 1
      });
      if (note.text) {
        pdfPage.drawText(note.text, {
          x: note.x + 4,
          y: pdfY + note.height - 14,
          size: 10,
          font: fontHelvetica,
          color: rgb(0.2, 0.2, 0.2)
        });
      }
    });

    // 6. Draw Text Items
    const texts = textItems[pageMeta.pageIndex] || [];
    texts.forEach((txt) => {
      if (!txt.text) return;

      const fontObj = getFontObj(txt.fontFamily, txt.bold);
      const textRgb = hexToRgb(txt.color || '#000000');
      const fontSize = txt.fontSize || 14;

      const pdfY = pHeight - txt.y - fontSize;

      if (txt.bgColor) {
        pdfPage.drawRectangle({
          x: txt.x,
          y: pdfY - 2,
          width: txt.width || (txt.text.length * fontSize * 0.5),
          height: fontSize + 4,
          color: hexToRgb(txt.bgColor)
        });
      }

      pdfPage.drawText(txt.text, {
        x: txt.x,
        y: Math.max(pdfY, 10),
        size: fontSize,
        font: fontObj,
        color: textRgb,
        opacity: txt.opacity ?? 1,
        rotate: degrees(txt.rotation || 0)
      });
    });
  }

  return await newPdfDoc.save();
}
