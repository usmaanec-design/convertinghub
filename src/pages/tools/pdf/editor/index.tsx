import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

import { useAuth } from '../../../../contexts/AuthContext';
import { executeProtectedDownload } from '../../../../utils/downloadInterceptor';
import { ToolComponentProps } from '@tools/defineTool';

import {
  EditorToolMode,
  PdfPageObject,
  PdfTextItem,
  PdfShapeItem,
  PdfImageItem,
  PdfStampItem,
  PdfLinkItem,
  PdfNoteItem,
  EditorActiveSelection,
  HistoryState
} from './pdfEditorTypes';
import PdfEditorHeader from './components/PdfEditorHeader';
import PdfEditorTopToolbar from './components/PdfEditorTopToolbar';
import PdfEditorSecondaryToolbar from './components/PdfEditorSecondaryToolbar';
import PdfEditorThumbnailSidebar from './components/PdfEditorThumbnailSidebar';
import PdfEditorFloatingNav from './components/PdfEditorFloatingNav';
import PdfEditorPageManagerModal from './components/PdfEditorPageManagerModal';
import PdfEditorSearchModal from './components/PdfEditorSearchModal';
import PdfStampModal, { StampPreset } from './components/PdfStampModal';
import PdfSignatureModal from './components/PdfSignatureModal';
import { exportModifiedPdf } from './pdfExporter';
import { usePendingConversionFile } from '../../../../hooks';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfEditor({ title }: ToolComponentProps) {
  const { isAuthenticated, signInWithGoogle } = useAuth();

  // PDF File & Document State
  const [file, setFile] = useState<File | null>(null);
  usePendingConversionFile(file, setFile);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);

  // Workspace Viewport & Navigation
  const [pages, setPages] = useState<PdfPageObject[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [toolMode, setToolMode] = useState<EditorToolMode>('select');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Objects Collections per Page Index
  const [textItems, setTextItems] = useState<Record<number, PdfTextItem[]>>({});
  const [shapeItems, setShapeItems] = useState<Record<number, PdfShapeItem[]>>({});
  const [imageItems, setImageItems] = useState<Record<number, PdfImageItem[]>>({});
  const [stampItems, setStampItems] = useState<Record<number, PdfStampItem[]>>({});
  const [linkItems, setLinkItems] = useState<Record<number, PdfLinkItem[]>>({});
  const [noteItems, setNoteItems] = useState<Record<number, PdfNoteItem[]>>({});
  const [whiteoutRects, setWhiteoutRects] = useState<Record<number, { x: number; y: number; width: number; height: number }[]>>({});

  // Active Selection State
  const [activeSelection, setActiveSelection] = useState<EditorActiveSelection>({ type: 'none' });

  // History (Undo / Redo)
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Status & Progress Flags
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMatches, setSearchMatches] = useState<{ pageIndex: number; x: number; y: number; width: number; height: number }[]>([]);
  const [searchMatchIndex, setSearchMatchIndex] = useState<number>(0);

  // Export Result State
  const [exportedPdfBlob, setExportedPdfBlob] = useState<Blob | null>(null);
  const [exportedFilename, setExportedFilename] = useState<string>('edited-document.pdf');

  // Modals
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [isStampModalOpen, setIsStampModalOpen] = useState<boolean>(false);
  const [isPageManagerOpen, setIsPageManagerOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Canvas & File Refs
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // History Helper
  const pushHistory = (
    newPages: PdfPageObject[],
    newTexts: Record<number, PdfTextItem[]>,
    newShapes: Record<number, PdfShapeItem[]>,
    newImages: Record<number, PdfImageItem[]>,
    newStamps: Record<number, PdfStampItem[]>,
    newLinks: Record<number, PdfLinkItem[]>,
    newNotes: Record<number, PdfNoteItem[]>,
    newWhiteouts: Record<number, { x: number; y: number; width: number; height: number }[]>
  ) => {
    const newState: HistoryState = {
      pages: JSON.parse(JSON.stringify(newPages)),
      textItems: JSON.parse(JSON.stringify(newTexts)),
      shapeItems: JSON.parse(JSON.stringify(newShapes)),
      imageItems: JSON.parse(JSON.stringify(newImages)),
      stampItems: JSON.parse(JSON.stringify(newStamps)),
      linkItems: JSON.parse(JSON.stringify(newLinks)),
      noteItems: JSON.parse(JSON.stringify(newNotes)),
      whiteoutRects: JSON.parse(JSON.stringify(newWhiteouts))
    };
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newState);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];
      setPages(state.pages);
      setTextItems(state.textItems);
      setShapeItems(state.shapeItems);
      setImageItems(state.imageItems);
      setStampItems(state.stampItems || {});
      setLinkItems(state.linkItems || {});
      setNoteItems(state.noteItems || {});
      setWhiteoutRects(state.whiteoutRects);
      setHistoryIndex(prevIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setPages(state.pages);
      setTextItems(state.textItems);
      setShapeItems(state.shapeItems);
      setImageItems(state.imageItems);
      setStampItems(state.stampItems || {});
      setLinkItems(state.linkItems || {});
      setNoteItems(state.noteItems || {});
      setWhiteoutRects(state.whiteoutRects);
      setHistoryIndex(nextIndex);
    }
  };

  // 1. File Upload & Analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    if (uploaded.type !== 'application/pdf' && !uploaded.name.endsWith('.pdf')) {
      setError('Invalid file type. Please upload a valid PDF document.');
      return;
    }

    try {
      setIsLoadingDoc(true);
      setError(null);
      setFile(uploaded);
      setExportedPdfBlob(null);

      const buffer = await uploaded.arrayBuffer();
      setPdfBuffer(buffer);

      const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
      setPdfDocProxy(doc);

      const loadedPages: PdfPageObject[] = [];
      const initTexts: Record<number, PdfTextItem[]> = {};

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });

        loadedPages.push({
          pageIndex: i - 1,
          originalRotation: page.rotate || 0,
          rotation: page.rotate || 0,
          width: viewport.width,
          height: viewport.height,
          aspectRatio: viewport.width / viewport.height,
          pdfPageWidth: viewport.width,
          pdfPageHeight: viewport.height
        });

        // Extract Text Streams
        const textContent = await page.getTextContent();
        const extractedTexts: PdfTextItem[] = [];

        textContent.items.forEach((item: any, idx: number) => {
          if (item.str && item.str.trim().length > 0) {
            const transform = item.transform;
            const x = transform[4];
            const y = viewport.height - transform[5] - (item.height || 12);
            const fontSize = Math.max(Math.round(item.height || Math.abs(transform[0]) || 12), 10);

            extractedTexts.push({
              id: `orig_txt_${i - 1}_${idx}`,
              text: item.str,
              x,
              y: Math.max(y, 10),
              width: item.width || Math.max(item.str.length * fontSize * 0.5, 20),
              height: fontSize * 1.2,
              fontSize,
              fontFamily: item.fontName || 'Helvetica',
              color: '#000000',
              bold: false,
              italic: false,
              underline: false,
              strikethrough: false,
              alignment: 'left',
              rotation: 0,
              opacity: 1,
              pageIndex: i - 1,
              isOriginal: true
            });
          }
        });

        initTexts[i - 1] = extractedTexts;
      }

      setPages(loadedPages);
      setTextItems(initTexts);
      setActivePageIndex(0);

      pushHistory(loadedPages, initTexts, {}, {}, {}, {}, {}, {});
    } catch (err: any) {
      setError(`Failed loading PDF document: ${err.message}`);
    } finally {
      setIsLoadingDoc(false);
    }
  };

  // 2. Render Active Page Background (PDF.js)
  useEffect(() => {
    let isCancelled = false;

    const renderPdfPage = async () => {
      if (!pdfDocProxy || !bgCanvasRef.current || pages.length === 0) return;
      const currentPageMeta = pages[activePageIndex];
      if (!currentPageMeta) return;

      try {
        const page = await pdfDocProxy.getPage(currentPageMeta.pageIndex + 1);
        if (isCancelled) return;

        const viewport = page.getViewport({
          scale: zoomLevel,
          rotation: currentPageMeta.rotation
        });

        const bgCanvas = bgCanvasRef.current;
        bgCanvas.width = viewport.width;
        bgCanvas.height = viewport.height;

        const context = bgCanvas.getContext('2d');
        if (context) {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, viewport.width, viewport.height);

          await page.render({
            canvasContext: context,
            viewport
          }).promise;
        }

        if (editorCanvasRef.current) {
          editorCanvasRef.current.width = viewport.width;
          editorCanvasRef.current.height = viewport.height;
        }
      } catch (err) {
        console.warn('PDF background render error:', err);
      }
    };

    renderPdfPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, activePageIndex, pages, zoomLevel]);

  // 3. Render Interactive Overlays Canvas
  useEffect(() => {
    if (!editorCanvasRef.current || pages.length === 0) return;
    const ctx = editorCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, editorCanvasRef.current.width, editorCanvasRef.current.height);

    // Draw Whiteouts
    const wRects = whiteoutRects[activePageIndex] || [];
    wRects.forEach((rect) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rect.x * zoomLevel, rect.y * zoomLevel, rect.width * zoomLevel, rect.height * zoomLevel);
    });

    // Draw Shapes
    const shapes = shapeItems[activePageIndex] || [];
    shapes.forEach((shape) => {
      ctx.save();
      ctx.globalAlpha = shape.opacity ?? 1;
      ctx.fillStyle = shape.type === 'highlight' ? 'rgba(253, 224, 71, 0.45)' : shape.fillColor || '#ffffff';
      ctx.strokeStyle = shape.strokeColor || '#2563eb';
      ctx.lineWidth = (shape.strokeWidth || 2) * zoomLevel;

      const sx = shape.x * zoomLevel;
      const sy = shape.y * zoomLevel;
      const sw = shape.width * zoomLevel;
      const sh = shape.height * zoomLevel;

      if (shape.type === 'rectangle' || shape.type === 'highlight' || shape.type === 'whiteout') {
        if (shape.type === 'whiteout') ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, sw, sh);
        if (shape.strokeWidth > 0 && shape.type !== 'whiteout') ctx.strokeRect(sx, sy, sw, sh);
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.ellipse(sx + sw / 2, sy + sh / 2, Math.abs(sw / 2), Math.abs(sh / 2), 0, 0, 2 * Math.PI);
        ctx.fill();
        if (shape.strokeWidth > 0) ctx.stroke();
      } else if (shape.type === 'line' || shape.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + sw, sy + sh);
        ctx.stroke();
      } else if (shape.type === 'checkmark' || shape.type === 'cross') {
        ctx.font = `bold ${Math.max(sh, 24)}px Helvetica`;
        ctx.fillStyle = shape.strokeColor || '#16a34a';
        ctx.fillText(shape.type === 'checkmark' ? '✓' : '✗', sx, sy + sh);
      }
      ctx.restore();
    });

    // Draw Images & Signatures
    const imgs = imageItems[activePageIndex] || [];
    imgs.forEach((imgItem) => {
      const img = new Image();
      img.src = imgItem.dataUrl;
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = imgItem.opacity ?? 1;
        ctx.drawImage(
          img,
          imgItem.x * zoomLevel,
          imgItem.y * zoomLevel,
          imgItem.width * zoomLevel,
          imgItem.height * zoomLevel
        );
        ctx.restore();
      };
    });

    // Draw Stamps
    const stamps = stampItems[activePageIndex] || [];
    stamps.forEach((stamp) => {
      ctx.save();
      ctx.globalAlpha = stamp.opacity ?? 0.95;
      const sx = stamp.x * zoomLevel;
      const sy = stamp.y * zoomLevel;
      const sw = stamp.width * zoomLevel;
      const sh = stamp.height * zoomLevel;

      ctx.fillStyle = stamp.bgColor || '#f0fdf4';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = stamp.borderColor || '#16a34a';
      ctx.lineWidth = 2 * zoomLevel;
      ctx.strokeRect(sx, sy, sw, sh);

      ctx.font = `bold ${Math.max(Math.round(sh * 0.45), 12)}px Helvetica`;
      ctx.fillStyle = stamp.color || '#16a34a';
      ctx.textBaseline = 'middle';
      ctx.fillText(stamp.label, sx + 8 * zoomLevel, sy + sh / 2);
      ctx.restore();
    });

    // Draw Notes (Sticky Annotations)
    const notes = noteItems[activePageIndex] || [];
    notes.forEach((note) => {
      ctx.save();
      const sx = note.x * zoomLevel;
      const sy = note.y * zoomLevel;
      ctx.fillStyle = note.color || '#fef08a';
      ctx.fillRect(sx, sy, note.width * zoomLevel, note.height * zoomLevel);
      ctx.strokeStyle = '#eab308';
      ctx.strokeRect(sx, sy, note.width * zoomLevel, note.height * zoomLevel);
      if (note.text) {
        ctx.font = `${11 * zoomLevel}px Helvetica`;
        ctx.fillStyle = '#1e293b';
        ctx.fillText(note.text.slice(0, 15), sx + 4, sy + 14 * zoomLevel);
      }
      ctx.restore();
    });

    // Draw Text Items
    const texts = textItems[activePageIndex] || [];
    texts.forEach((txt) => {
      ctx.save();
      ctx.globalAlpha = txt.opacity ?? 1;
      ctx.font = `${txt.italic ? 'italic ' : ''}${txt.bold ? 'bold ' : ''}${txt.fontSize * zoomLevel}px ${txt.fontFamily}`;
      
      if (txt.bgColor) {
        ctx.fillStyle = txt.bgColor;
        ctx.fillRect(txt.x * zoomLevel, txt.y * zoomLevel, txt.width * zoomLevel, txt.height * zoomLevel);
      }

      ctx.fillStyle = txt.color || '#000000';
      ctx.textBaseline = 'top';
      ctx.fillText(txt.text, txt.x * zoomLevel, txt.y * zoomLevel);

      // Selection Highlight Border
      if (activeSelection.id === txt.id) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          txt.x * zoomLevel - 4,
          txt.y * zoomLevel - 4,
          (txt.width + 8) * zoomLevel,
          (txt.height + 8) * zoomLevel
        );
      }
      ctx.restore();
    });
  }, [activePageIndex, textItems, shapeItems, imageItems, stampItems, noteItems, whiteoutRects, zoomLevel, activeSelection, pages]);

  // 4. Canvas Click & Interaction
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editorCanvasRef.current) return;
    const rect = editorCanvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoomLevel;
    const clickY = (e.clientY - rect.top) / zoomLevel;

    // Check if clicked text
    const pageTexts = textItems[activePageIndex] || [];
    const clickedText = pageTexts.find(
      (t) =>
        clickX >= t.x &&
        clickX <= t.x + t.width &&
        clickY >= t.y &&
        clickY <= t.y + t.height
    );

    if (clickedText) {
      setActiveSelection({
        type: 'text',
        id: clickedText.id,
        text: clickedText.text,
        fontSize: clickedText.fontSize,
        fontFamily: clickedText.fontFamily,
        color: clickedText.color,
        bgColor: clickedText.bgColor,
        bold: clickedText.bold,
        italic: clickedText.italic,
        underline: clickedText.underline,
        alignment: clickedText.alignment,
        opacity: clickedText.opacity
      });
      return;
    }

    // Tool Actions
    if (toolMode === 'text' || toolMode === 'editText') {
      const newText: PdfTextItem = {
        id: `txt_${Date.now()}`,
        text: 'Click to edit text',
        x: clickX,
        y: clickY,
        width: 140,
        height: 24,
        fontSize: 16,
        fontFamily: 'Helvetica',
        color: '#000000',
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        alignment: 'left',
        rotation: 0,
        opacity: 1,
        pageIndex: activePageIndex
      };
      const updatedTexts = { ...textItems, [activePageIndex]: [...pageTexts, newText] };
      setTextItems(updatedTexts);
      pushHistory(pages, updatedTexts, shapeItems, imageItems, stampItems, linkItems, noteItems, whiteoutRects);
      setActiveSelection({
        type: 'text',
        id: newText.id,
        text: newText.text,
        fontSize: 16,
        fontFamily: 'Helvetica',
        color: '#000000'
      });
    } else if (['rectangle', 'circle', 'line', 'arrow', 'whiteout', 'highlight', 'checkmark', 'cross'].includes(toolMode)) {
      const newShape: PdfShapeItem = {
        id: `shape_${Date.now()}`,
        type: toolMode as any,
        x: clickX,
        y: clickY,
        width: toolMode === 'checkmark' || toolMode === 'cross' ? 32 : 120,
        height: toolMode === 'checkmark' || toolMode === 'cross' ? 32 : 80,
        fillColor: toolMode === 'highlight' ? '#ffff00' : '#ffffff',
        strokeColor: toolMode === 'whiteout' ? '#ffffff' : '#2563eb',
        strokeWidth: toolMode === 'whiteout' ? 0 : 2,
        opacity: toolMode === 'highlight' ? 0.45 : 1,
        rotation: 0,
        pageIndex: activePageIndex
      };
      const pageShapes = shapeItems[activePageIndex] || [];
      const updatedShapes = { ...shapeItems, [activePageIndex]: [...pageShapes, newShape] };
      setShapeItems(updatedShapes);
      pushHistory(pages, textItems, updatedShapes, imageItems, stampItems, linkItems, noteItems, whiteoutRects);
    } else if (toolMode === 'note') {
      const newNote: PdfNoteItem = {
        id: `note_${Date.now()}`,
        text: 'Add your comment note here...',
        color: '#fef08a',
        x: clickX,
        y: clickY,
        width: 140,
        height: 60,
        pageIndex: activePageIndex
      };
      const pageNotes = noteItems[activePageIndex] || [];
      const updatedNotes = { ...noteItems, [activePageIndex]: [...pageNotes, newNote] };
      setNoteItems(updatedNotes);
      pushHistory(pages, textItems, shapeItems, imageItems, stampItems, linkItems, updatedNotes, whiteoutRects);
    } else {
      setActiveSelection({ type: 'none' });
    }
  };

  // 5. Update Selection Properties
  const handleUpdateSelection = (updates: Partial<EditorActiveSelection>) => {
    if (activeSelection.type === 'text' && activeSelection.id) {
      const pageTexts = textItems[activePageIndex] || [];
      const updatedList = pageTexts.map((t) => {
        if (t.id === activeSelection.id) {
          return {
            ...t,
            text: updates.text !== undefined ? updates.text : t.text,
            fontSize: updates.fontSize !== undefined ? updates.fontSize : t.fontSize,
            fontFamily: updates.fontFamily !== undefined ? updates.fontFamily : t.fontFamily,
            color: updates.color !== undefined ? updates.color : t.color,
            bgColor: updates.bgColor !== undefined ? updates.bgColor : t.bgColor,
            bold: updates.bold !== undefined ? updates.bold : t.bold,
            italic: updates.italic !== undefined ? updates.italic : t.italic,
            underline: updates.underline !== undefined ? updates.underline : t.underline,
            alignment: updates.alignment !== undefined ? updates.alignment : t.alignment,
            opacity: updates.opacity !== undefined ? updates.opacity : t.opacity
          };
        }
        return t;
      });
      const updatedTexts = { ...textItems, [activePageIndex]: updatedList };
      setTextItems(updatedTexts);
      setActiveSelection((prev) => ({ ...prev, ...updates }));
      pushHistory(pages, updatedTexts, shapeItems, imageItems, stampItems, linkItems, noteItems, whiteoutRects);
    }
  };

  const handleDeleteSelectedObject = () => {
    if (activeSelection.id) {
      if (activeSelection.type === 'text') {
        const pageTexts = (textItems[activePageIndex] || []).filter((t) => t.id !== activeSelection.id);
        const updatedTexts = { ...textItems, [activePageIndex]: pageTexts };
        setTextItems(updatedTexts);
        pushHistory(pages, updatedTexts, shapeItems, imageItems, stampItems, linkItems, noteItems, whiteoutRects);
      }
      setActiveSelection({ type: 'none' });
    }
  };

  // 6. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveAndExport();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelectedObject();
      } else if (e.key === 'Escape') {
        setActiveSelection({ type: 'none' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, activeSelection, pages]);

  // 7. Page Actions
  const handleRotatePage = (index: number) => {
    const nextPages = pages.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
    setPages(nextPages);
    pushHistory(nextPages, textItems, shapeItems, imageItems, stampItems, linkItems, noteItems, whiteoutRects);
  };

  const handleDuplicatePage = (index: number) => {
    const pageToDup = pages[index];
    const newPage: PdfPageObject = { ...pageToDup, pageIndex: pages.length };
    const nextPages = [...pages.slice(0, index + 1), newPage, ...pages.slice(index + 1)];
    setPages(nextPages);
    pushHistory(nextPages, textItems, shapeItems, imageItems, stampItems, linkItems, noteItems, whiteoutRects);
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    const nextPages = pages.filter((_, i) => i !== index);
    setPages(nextPages);
    if (activePageIndex >= nextPages.length) {
      setActivePageIndex(nextPages.length - 1);
    }
    pushHistory(nextPages, textItems, shapeItems, imageItems, stampItems, linkItems, noteItems, whiteoutRects);
  };

  // 8. Signatures, Images, Stamps
  const handleApplySignature = (dataUrl: string) => {
    const newImg: PdfImageItem = {
      id: `sig_${Date.now()}`,
      dataUrl,
      x: 80,
      y: 80,
      width: 180,
      height: 80,
      rotation: 0,
      opacity: 1,
      pageIndex: activePageIndex,
      isSignature: true
    };
    const pageImgs = imageItems[activePageIndex] || [];
    const updatedImages = { ...imageItems, [activePageIndex]: [...pageImgs, newImg] };
    setImageItems(updatedImages);
    pushHistory(pages, textItems, shapeItems, updatedImages, stampItems, linkItems, noteItems, whiteoutRects);
  };

  const handleApplyStamp = (preset: StampPreset) => {
    const newStamp: PdfStampItem = {
      id: `stamp_${Date.now()}`,
      label: preset.label,
      color: preset.color,
      bgColor: preset.bgColor,
      borderColor: preset.borderColor,
      x: 100,
      y: 100,
      width: 160,
      height: 48,
      rotation: 0,
      opacity: 0.95,
      pageIndex: activePageIndex
    };
    const pageStamps = stampItems[activePageIndex] || [];
    const updatedStamps = { ...stampItems, [activePageIndex]: [...pageStamps, newStamp] };
    setStampItems(updatedStamps);
    pushHistory(pages, textItems, shapeItems, imageItems, updatedStamps, linkItems, noteItems, whiteoutRects);
  };

  const handleImageInserted = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (imgFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg: PdfImageItem = {
            id: `img_${Date.now()}`,
            dataUrl: event.target.result as string,
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            rotation: 0,
            opacity: 1,
            pageIndex: activePageIndex
          };
          const pageImgs = imageItems[activePageIndex] || [];
          const updatedImages = { ...imageItems, [activePageIndex]: [...pageImgs, newImg] };
          setImageItems(updatedImages);
          pushHistory(pages, textItems, shapeItems, updatedImages, stampItems, linkItems, noteItems, whiteoutRects);
        }
      };
      reader.readAsDataURL(imgFile);
    }
  };

  // 9. Save & Export PDF Binary
  const handleSaveAndExport = async () => {
    if (!pdfBuffer) return;
    try {
      setIsSaving(true);
      setError(null);

      const modifiedBytes = await exportModifiedPdf({
        originalPdfBuffer: pdfBuffer,
        pages,
        textItems,
        shapeItems,
        imageItems,
        stampItems,
        linkItems,
        noteItems,
        whiteoutRects
      });

      const blob = new Blob([new Uint8Array(modifiedBytes)], { type: 'application/pdf' });
      setExportedPdfBlob(blob);
      setExportedFilename(file ? `edited-${file.name}` : 'edited-document.pdf');

      // Auto Download
      executeProtectedDownload(
        () => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file ? `edited-${file.name}` : 'edited-document.pdf';
          a.click();
          URL.revokeObjectURL(url);
        },
        { isAuthenticated, signInWithGoogle }
      );
    } catch (err: any) {
      setError(`Failed exporting PDF: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <input type="file" ref={fileInputRef} accept="image/*" hidden onChange={handleImageInserted} />

      {/* 1. UPLOAD STATE (WHEN NO FILE IS LOADED) */}
      {!file && (
        <Paper
          sx={{
            p: 6,
            maxWidth: 750,
            mx: 'auto',
            mt: 8,
            textAlign: 'center',
            borderRadius: 4,
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            bgcolor: '#ffffff'
          }}
        >
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex'
              }}
            >
              <UploadFileIcon sx={{ fontSize: 56 }} />
            </Box>

            <Typography variant="h4" fontWeight="800" color="#0f172a">
              {title || 'ConvertingHub PDF Editor'}
            </Typography>

            <Typography variant="body1" color="#64748b">
              Upload any PDF document to edit text, add signatures, draw shapes, highlight, and reorganize pages in a professional browser workspace.
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <Box
              sx={{
                border: '2px dashed #2563eb',
                borderRadius: 3,
                p: 5,
                width: '100%',
                bgcolor: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: '#eff6ff', borderColor: '#1d4ed8' }
              }}
              component="label"
            >
              <input type="file" accept=".pdf" hidden onChange={handleFileUpload} />
              <Typography variant="h6" fontWeight="800" color="#2563eb">
                Click to select or drag & drop PDF here
              </Typography>
              <Typography variant="caption" color="#64748b">
                Secure & Fast Browser-Native PDF Processing
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* 2. FULL WORKSPACE (WHEN FILE IS LOADED) */}
      {file && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100vh', overflow: 'hidden' }}>
          {/* Header */}
          <PdfEditorHeader
            filename={file.name}
            onDone={handleSaveAndExport}
            isSaving={isSaving}
          />

          {/* Top Toolbar */}
          <PdfEditorTopToolbar
            toolMode={toolMode}
            onSetToolMode={setToolMode}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
            onImageUploadClick={() => fileInputRef.current?.click()}
            onOpenStampModal={() => setIsStampModalOpen(true)}
            onOpenPageManager={() => setIsPageManagerOpen(true)}
            onOpenSearchModal={() => setIsSearchModalOpen(true)}
            onPrint={() => window.print()}
          />

          {/* Contextual Secondary Toolbar */}
          <PdfEditorSecondaryToolbar
            toolMode={toolMode}
            activeSelection={activeSelection}
            onUpdateSelection={handleUpdateSelection}
            onDeleteSelection={handleDeleteSelectedObject}
            onDuplicateSelection={() => {}}
          />

          {/* MAIN SPLIT WORKSPACE */}
          <Box sx={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 150px)', overflow: 'hidden', position: 'relative' }}>
            {/* Left Page Thumbnails Sidebar */}
            <PdfEditorThumbnailSidebar
              pages={pages}
              activePageIndex={activePageIndex}
              onSelectPage={setActivePageIndex}
              onRotatePage={handleRotatePage}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
              pdfDocProxy={pdfDocProxy}
              isOpen={isSidebarOpen}
            />

            {/* Center Main Document Workspace */}
            <Box
              sx={{
                flexGrow: 1,
                bgcolor: '#f1f5f9',
                p: 4,
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                position: 'relative'
              }}
            >
              {isLoadingDoc && (
                <Box display="flex" alignItems="center" gap={2} sx={{ mt: 10 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body1" fontWeight="600" color="#475569">
                    Rendering PDF Pages...
                  </Typography>
                </Box>
              )}

              {!isLoadingDoc && (
                <Box
                  sx={{
                    position: 'relative',
                    bgcolor: '#ffffff',
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    borderRadius: 1,
                    border: '1px solid #e2e8f0',
                    mb: 10
                  }}
                >
                  {/* Background PDF.js Canvas */}
                  <canvas ref={bgCanvasRef} style={{ display: 'block' }} />

                  {/* Interactive Overlays Canvas */}
                  <canvas
                    ref={editorCanvasRef}
                    onClick={handleCanvasClick}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      cursor: toolMode === 'text' ? 'text' : toolMode === 'hand' ? 'grab' : 'crosshair'
                    }}
                  />
                </Box>
              )}

              {/* Floating Bottom Nav */}
              <PdfEditorFloatingNav
                currentPage={activePageIndex + 1}
                totalPages={pages.length}
                onPrevPage={() => setActivePageIndex((prev) => Math.max(prev - 1, 0))}
                onNextPage={() => setActivePageIndex((prev) => Math.min(prev + 1, pages.length - 1))}
                zoomLevel={zoomLevel}
                onZoomIn={() => setZoomLevel((prev) => Math.min(prev + 0.15, 2.5))}
                onZoomOut={() => setZoomLevel((prev) => Math.max(prev - 0.15, 0.5))}
                onFitWidth={() => setZoomLevel(1.2)}
                onFitPage={() => setZoomLevel(1.0)}
                toolMode={toolMode}
                onSetToolMode={setToolMode}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* MODALS */}
      <PdfSignatureModal
        open={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onApplySignature={handleApplySignature}
      />

      <PdfStampModal
        open={isStampModalOpen}
        onClose={() => setIsStampModalOpen(false)}
        onSelectStamp={handleApplyStamp}
      />

      <PdfEditorPageManagerModal
        open={isPageManagerOpen}
        onClose={() => setIsPageManagerOpen(false)}
        pages={pages}
        onUpdatePages={setPages}
        pdfDocProxy={pdfDocProxy}
      />

      <PdfEditorSearchModal
        open={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearchQueryChange={setSearchQuery}
        onNextMatch={() => setSearchMatchIndex((prev) => (prev + 1) % (searchMatches.length || 1))}
        onPrevMatch={() => setSearchMatchIndex((prev) => (prev - 1 + searchMatches.length) % (searchMatches.length || 1))}
        matchIndex={searchMatchIndex}
        totalMatches={searchMatches.length}
      />
    </Box>
  );
}
