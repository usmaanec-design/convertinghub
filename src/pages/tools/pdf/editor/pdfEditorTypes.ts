export type EditorToolMode =
  | 'select'
  | 'hand'
  | 'text'
  | 'editText'
  | 'rectangle'
  | 'circle'
  | 'checkmark'
  | 'cross'
  | 'line'
  | 'arrow'
  | 'freehand'
  | 'whiteout'
  | 'highlight'
  | 'image'
  | 'signature'
  | 'stamp'
  | 'link'
  | 'note';

export interface PdfPageObject {
  pageIndex: number; // 0-based original index
  originalRotation: number;
  rotation: number; // 0, 90, 180, 270
  width: number;
  height: number;
  aspectRatio: number;
  pdfPageWidth: number;
  pdfPageHeight: number;
  isScanned?: boolean;
}

export interface PdfTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bgColor?: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  alignment: 'left' | 'center' | 'right';
  rotation: number;
  opacity: number;
  pageIndex: number;
  isOriginal?: boolean;
}

export interface PdfShapeItem {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'whiteout' | 'highlight' | 'freehand' | 'checkmark' | 'cross';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  points?: number[]; // for freehand / line / arrow
  pageIndex: number;
}

export interface PdfImageItem {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  pageIndex: number;
  isSignature?: boolean;
}

export interface PdfStampItem {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  pageIndex: number;
}

export interface PdfLinkItem {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

export interface PdfNoteItem {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  isOpen?: boolean;
}

export interface EditorActiveSelection {
  type: 'text' | 'shape' | 'image' | 'stamp' | 'link' | 'note' | 'none';
  id?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  bgColor?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  alignment?: 'left' | 'center' | 'right';
  opacity?: number;
  rotation?: number;
  width?: number;
  height?: number;
  url?: string;
  label?: string;
}

export interface HistoryState {
  pages: PdfPageObject[];
  textItems: Record<number, PdfTextItem[]>;
  shapeItems: Record<number, PdfShapeItem[]>;
  imageItems: Record<number, PdfImageItem[]>;
  stampItems: Record<number, PdfStampItem[]>;
  linkItems: Record<number, PdfLinkItem[]>;
  noteItems: Record<number, PdfNoteItem[]>;
  whiteoutRects: Record<number, { x: number; y: number; width: number; height: number }[]>;
}
