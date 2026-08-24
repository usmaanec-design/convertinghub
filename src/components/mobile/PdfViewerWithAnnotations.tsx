import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Chip,
  TextField,
  CircularProgress,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SearchIcon from '@mui/icons-material/Search';
import GestureIcon from '@mui/icons-material/Gesture';
import HighlightIcon from '@mui/icons-material/Highlight';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import CloseIcon from '@mui/icons-material/Close';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AnnotationTool = 'blue-pen' | 'black-pen' | 'red-pen' | 'highlighter' | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  tool: AnnotationTool;
  color: string;
  width: number;
  composite: GlobalCompositeOperation;
  points: Point[];
}

interface PageAnnotations {
  strokes: Stroke[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toolConfig(tool: AnnotationTool): { color: string; width: number; composite: GlobalCompositeOperation } {
  switch (tool) {
    case 'blue-pen':
      return { color: '#2563eb', width: 3, composite: 'source-over' };
    case 'black-pen':
      return { color: '#1e293b', width: 3, composite: 'source-over' };
    case 'red-pen':
      return { color: '#ef4444', width: 3, composite: 'source-over' };
    case 'highlighter':
      return { color: 'rgba(255,230,0,0.45)', width: 22, composite: 'source-over' };
    case 'eraser':
      return { color: 'rgba(0,0,0,1)', width: 28, composite: 'destination-out' };
  }
}

function renderStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    ctx.save();
    ctx.globalCompositeOperation = stroke.composite;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const mx = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const my = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mx, my);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  fileObj?: File;
  fileUrl?: string;
  fileName?: string;
}

const PdfViewerWithAnnotations: React.FC<Props> = ({
  fileObj,
  fileUrl,
  fileName = 'document.pdf'
}) => {
  // PDF state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const annotCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [totalPages, setTotalPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(0);

  // Annotation state
  const [annotMode, setAnnotMode] = useState(false);
  const [tool, setTool] = useState<AnnotationTool>('blue-pen');

  // Per-page annotation history: key = pageNum, value = snapshot stack (index = undo pointer)
  const pageAnnotsRef = useRef<Record<number, Stroke[][]>>({});
  const pageUndoIdxRef = useRef<Record<number, number>>({});

  // Re-render trigger for undo/redo UI
  const [historyVersion, setHistoryVersion] = useState(0);

  // Active drawing stroke (stored as ref to avoid re-renders during draw)
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPages, setSearchPages] = useState<number[]>([]);
  const [searchHitIdx, setSearchHitIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchDrawer, setSearchDrawer] = useState(false);

  // Double-tap
  const lastTapRef = useRef(0);

  // ── Load PDF ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPageNum(1);
    pageAnnotsRef.current = {};
    pageUndoIdxRef.current = {};

    const load = async () => {
      try {
        let data: Uint8Array | null = null;
        if (fileObj) {
          data = new Uint8Array(await fileObj.arrayBuffer());
        } else if (fileUrl) {
          const res = await fetch(fileUrl);
          data = new Uint8Array(await res.arrayBuffer());
        }
        if (!data || cancelled) return;
        const pdf = await pdfjsLib.getDocument({
          data,
          cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
          cMapPacked: true
        }).promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setPageNum(1);
      } catch (e) {
        console.error('[PdfViewer] load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fileObj, fileUrl]);

  // ── Render PDF page ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;

    const render = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = pdfCanvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setCanvasW(viewport.width);
      setCanvasH(viewport.height);
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
    };

    render().catch(console.error);
  }, [pdfDoc, pageNum, scale]);

  // ── Re-render annotation canvas when strokes change ───────────────────────────
  const redrawAnnotations = useCallback((forPage: number) => {
    if (!annotCanvasRef.current) return;
    const ctx = annotCanvasRef.current.getContext('2d')!;
    const strokes = currentStrokes(forPage);
    renderStrokes(ctx, strokes);
  }, []);

  // Size annotation canvas when PDF canvas size changes
  useEffect(() => {
    if (!annotCanvasRef.current || canvasW === 0) return;
    annotCanvasRef.current.width = canvasW;
    annotCanvasRef.current.height = canvasH;
    redrawAnnotations(pageNum);
  }, [canvasW, canvasH, pageNum, redrawAnnotations]);

  // ── Annotation helpers ────────────────────────────────────────────────────────
  function currentStrokes(page: number): Stroke[] {
    const stack = pageAnnotsRef.current[page];
    if (!stack || stack.length === 0) return [];
    const idx = pageUndoIdxRef.current[page] ?? stack.length - 1;
    return stack[idx] ?? [];
  }

  function pushStroke(page: number, stroke: Stroke) {
    const existing = currentStrokes(page);
    const newState = [...existing, stroke];
    const stack = pageAnnotsRef.current[page] ?? [];
    const idx = pageUndoIdxRef.current[page] ?? stack.length - 1;
    // Truncate redo history
    const newStack = stack.slice(0, idx + 1);
    newStack.push(newState);
    pageAnnotsRef.current[page] = newStack;
    pageUndoIdxRef.current[page] = newStack.length - 1;
  }

  const canUndo = (): boolean => {
    const idx = pageUndoIdxRef.current[pageNum] ?? -1;
    return idx > 0;
  };

  const canRedo = (): boolean => {
    const stack = pageAnnotsRef.current[pageNum] ?? [];
    const idx = pageUndoIdxRef.current[pageNum] ?? -1;
    return idx < stack.length - 1;
  };

  const handleUndo = () => {
    const idx = pageUndoIdxRef.current[pageNum] ?? -1;
    if (idx <= 0) return;
    pageUndoIdxRef.current[pageNum] = idx - 1;
    redrawAnnotations(pageNum);
    setHistoryVersion((v) => v + 1);
  };

  const handleRedo = () => {
    const stack = pageAnnotsRef.current[pageNum] ?? [];
    const idx = pageUndoIdxRef.current[pageNum] ?? -1;
    if (idx >= stack.length - 1) return;
    pageUndoIdxRef.current[pageNum] = idx + 1;
    redrawAnnotations(pageNum);
    setHistoryVersion((v) => v + 1);
  };

  const handleClearPage = () => {
    const existing = currentStrokes(pageNum);
    if (existing.length === 0) return;
    const stack = pageAnnotsRef.current[pageNum] ?? [];
    const idx = pageUndoIdxRef.current[pageNum] ?? stack.length - 1;
    const newStack = stack.slice(0, idx + 1);
    newStack.push([]); // empty state
    pageAnnotsRef.current[pageNum] = newStack;
    pageUndoIdxRef.current[pageNum] = newStack.length - 1;
    redrawAnnotations(pageNum);
    setHistoryVersion((v) => v + 1);
  };

  // ── Pointer event handlers ────────────────────────────────────────────────────
  const getCanvasPoint = (
    e: React.PointerEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ): Point => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!annotMode) return;
    e.preventDefault();
    const canvas = annotCanvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e, canvas);
    const cfg = toolConfig(tool);
    currentStrokeRef.current = { ...cfg, points: [pt] };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!annotMode || !isDrawingRef.current || !currentStrokeRef.current) return;
    e.preventDefault();
    const canvas = annotCanvasRef.current!;
    const pt = getCanvasPoint(e, canvas);
    currentStrokeRef.current.points.push(pt);

    // Live draw the current stroke on top of committed strokes
    const ctx = canvas.getContext('2d')!;
    renderStrokes(ctx, currentStrokes(pageNum));

    // Draw in-progress stroke
    const s = currentStrokeRef.current;
    if (s.points.length >= 2) {
      ctx.save();
      ctx.globalCompositeOperation = s.composite;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length - 1; i++) {
        const mx = (s.points[i].x + s.points[i + 1].x) / 2;
        const my = (s.points[i].y + s.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, mx, my);
      }
      const last = s.points[s.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (stroke.points.length >= 2) {
      pushStroke(pageNum, stroke);
      redrawAnnotations(pageNum);
      setHistoryVersion((v) => v + 1);
    }
  };

  // ── Print ─────────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!pdfCanvasRef.current) return;
    const pdfCanvas = pdfCanvasRef.current;

    // Merge PDF + annotations
    const merged = document.createElement('canvas');
    merged.width = pdfCanvas.width;
    merged.height = pdfCanvas.height;
    const ctx = merged.getContext('2d')!;
    ctx.drawImage(pdfCanvas, 0, 0);
    if (annotCanvasRef.current) {
      ctx.drawImage(annotCanvasRef.current, 0, 0);
    }

    const dataUrl = merged.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(
      `<html><head><title>${fileName} — Page ${pageNum}</title>` +
        `<style>body{margin:0}img{max-width:100%;height:auto}` +
        `@media print{body{margin:0}}</style></head>` +
        `<body><img src="${dataUrl}" onload="window.print();window.close()"/></body></html>`
    );
    win.document.close();
  };

  // ── Share ─────────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (navigator.share && fileObj) {
      try {
        await navigator.share({ files: [fileObj], title: fileName });
      } catch (_) {
        // User cancelled or not supported
      }
    }
  };

  // ── Export annotated page ─────────────────────────────────────────────────────
  const handleExport = () => {
    if (!pdfCanvasRef.current) return;
    const pdfCanvas = pdfCanvasRef.current;
    const merged = document.createElement('canvas');
    merged.width = pdfCanvas.width;
    merged.height = pdfCanvas.height;
    const ctx = merged.getContext('2d')!;
    ctx.drawImage(pdfCanvas, 0, 0);
    if (annotCanvasRef.current) {
      ctx.drawImage(annotCanvasRef.current, 0, 0);
    }
    merged.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annotated_${fileName.replace(/\.pdf$/i, '')}_p${pageNum}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // ── Search ────────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    setSearching(true);
    const pages: number[] = [];
    const q = searchQuery.toLowerCase();
    for (let i = 1; i <= totalPages; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const text = (content.items as any[]).map((it) => it.str).join(' ').toLowerCase();
        if (text.includes(q)) pages.push(i);
      } catch (_) {}
    }
    setSearchPages(pages);
    setSearchHitIdx(0);
    setSearching(false);
    if (pages.length > 0) {
      setPageNum(pages[0]);
      setSearchDrawer(true);
    }
  };

  const jumpToSearchResult = (idx: number) => {
    setSearchHitIdx(idx);
    setPageNum(searchPages[idx]);
    setSearchDrawer(false);
  };

  // ── Double-tap zoom ───────────────────────────────────────────────────────────
  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      setScale((s) => (s < 1.5 ? 2.0 : 1.2));
    }
    lastTapRef.current = now;
  };

  // ── Page navigation ───────────────────────────────────────────────────────────
  const goTo = (n: number) => setPageNum(Math.max(1, Math.min(totalPages, n)));

  // ── Tool button style ─────────────────────────────────────────────────────────
  const toolBtnSx = (active: boolean) => ({
    bgcolor: active ? 'rgba(255,255,255,0.22)' : 'transparent',
    borderRadius: '8px',
    p: 0.5
  });

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      {searchOpen && (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            bgcolor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0
          }}
        >
          <TextField
            size="small"
            placeholder="Search in PDF…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
            sx={{ flex: 1, '& .MuiInputBase-root': { borderRadius: '20px', fontSize: '0.85rem' } }}
          />
          {searching ? (
            <CircularProgress size={18} sx={{ color: '#2563eb' }} />
          ) : searchPages.length > 0 ? (
            <Chip
              label={`${searchHitIdx + 1}/${searchPages.length}`}
              size="small"
              clickable
              onClick={() => setSearchDrawer(true)}
              sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#2563eb', color: '#fff' }}
            />
          ) : null}
          <IconButton size="small" onClick={() => { setSearchOpen(false); setSearchPages([]); setSearchQuery(''); }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* ── Annotation Toolbar ──────────────────────────────────────────────── */}
      {annotMode && (
        <Box
          sx={{
            px: 1,
            py: 0.75,
            bgcolor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            overflowX: 'auto',
            flexShrink: 0,
            '&::-webkit-scrollbar': { display: 'none' }
          }}
        >
          {/* Blue Pen */}
          <Tooltip title="Blue Pen">
            <IconButton size="small" onClick={() => setTool('blue-pen')} sx={toolBtnSx(tool === 'blue-pen')}>
              <GestureIcon sx={{ color: '#3b82f6', fontSize: 22 }} />
            </IconButton>
          </Tooltip>
          {/* Black Pen */}
          <Tooltip title="Black Pen">
            <IconButton size="small" onClick={() => setTool('black-pen')} sx={toolBtnSx(tool === 'black-pen')}>
              <GestureIcon sx={{ color: '#e2e8f0', fontSize: 22 }} />
            </IconButton>
          </Tooltip>
          {/* Red Pen */}
          <Tooltip title="Red Pen">
            <IconButton size="small" onClick={() => setTool('red-pen')} sx={toolBtnSx(tool === 'red-pen')}>
              <GestureIcon sx={{ color: '#ef4444', fontSize: 22 }} />
            </IconButton>
          </Tooltip>
          {/* Highlighter */}
          <Tooltip title="Highlighter">
            <IconButton size="small" onClick={() => setTool('highlighter')} sx={toolBtnSx(tool === 'highlighter')}>
              <HighlightIcon sx={{ color: '#fbbf24', fontSize: 22 }} />
            </IconButton>
          </Tooltip>
          {/* Eraser */}
          <Tooltip title="Eraser">
            <IconButton size="small" onClick={() => setTool('eraser')} sx={toolBtnSx(tool === 'eraser')}>
              <AutoFixNormalIcon sx={{ color: '#94a3b8', fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          <Box sx={{ flex: 1 }} />

          {/* Undo */}
          <Tooltip title="Undo">
            <span>
              <IconButton
                size="small"
                onClick={handleUndo}
                disabled={historyVersion >= 0 && !canUndo()}
                sx={{ color: historyVersion >= 0 && canUndo() ? '#93c5fd' : '#334155' }}
              >
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {/* Redo */}
          <Tooltip title="Redo">
            <span>
              <IconButton
                size="small"
                onClick={handleRedo}
                disabled={historyVersion >= 0 && !canRedo()}
                sx={{ color: historyVersion >= 0 && canRedo() ? '#93c5fd' : '#334155' }}
              >
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {/* Clear Page */}
          <Tooltip title="Clear All Annotations">
            <IconButton size="small" onClick={handleClearPage} sx={{ color: '#f87171' }}>
              <DeleteSweepIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* Save/Export */}
          <Tooltip title="Export Annotated Page">
            <IconButton size="small" onClick={handleExport} sx={{ color: '#34d399' }}>
              <SaveAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* Close annotation mode */}
          <Tooltip title="Close Annotation Mode">
            <IconButton size="small" onClick={() => setAnnotMode(false)} sx={{ color: '#f87171' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* ── PDF Viewport ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          p: 1.5,
          bgcolor: '#e2e8f0'
        }}
        onTouchEnd={handleTouchEnd}
      >
        {loading && (
          <Box sx={{ pt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={44} sx={{ color: '#2563eb' }} />
            <Typography variant="body2" color="#64748b">
              Loading PDF…
            </Typography>
          </Box>
        )}

        {!loading && (
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              borderRadius: '6px',
              overflow: 'hidden',
              bgcolor: '#ffffff',
              maxWidth: '100%'
            }}
          >
            {/* PDF canvas */}
            <canvas
              ref={pdfCanvasRef}
              style={{ display: 'block', maxWidth: '100%', touchAction: annotMode ? 'none' : 'auto' }}
            />
            {/* Annotation overlay canvas */}
            <canvas
              ref={annotCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                touchAction: 'none',
                cursor: annotMode
                  ? tool === 'eraser'
                    ? 'cell'
                    : 'crosshair'
                  : 'default',
                pointerEvents: annotMode ? 'auto' : 'none'
              }}
            />
          </Box>
        )}
      </Box>

      {/* ── Bottom Toolbar ───────────────────────────────────────────────────── */}
      {!loading && (
        <Box
          sx={{
            px: 1,
            py: 0.75,
            bgcolor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            flexShrink: 0,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' }
          }}
        >
          {/* Page navigation */}
          <IconButton size="small" onClick={() => goTo(pageNum - 1)} disabled={pageNum <= 1}>
            <NavigateBeforeIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ minWidth: 52, textAlign: 'center', color: '#0f172a', fontSize: '0.78rem' }}
          >
            {pageNum}/{totalPages}
          </Typography>
          <IconButton size="small" onClick={() => goTo(pageNum + 1)} disabled={pageNum >= totalPages}>
            <NavigateNextIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          {/* Zoom out */}
          <IconButton
            size="small"
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))}
          >
            <ZoomOutIcon sx={{ fontSize: 20, color: '#64748b' }} />
          </IconButton>
          <Chip
            label={`${Math.round(scale * 100)}%`}
            size="small"
            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#0f172a' }}
          />
          {/* Zoom in */}
          <IconButton size="small" onClick={() => setScale((s) => Math.min(3.5, +(s + 0.25).toFixed(2)))}>
            <ZoomInIcon sx={{ fontSize: 20, color: '#64748b' }} />
          </IconButton>

          <Box sx={{ width: 4 }} />

          {/* Search */}
          <Tooltip title="Search in PDF">
            <IconButton size="small" onClick={() => setSearchOpen((v) => !v)} sx={{ color: searchOpen ? '#2563eb' : '#64748b' }}>
              <SearchIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* Annotate */}
          <Tooltip title="Annotation Tools">
            <IconButton size="small" onClick={() => setAnnotMode((v) => !v)} sx={{ color: annotMode ? '#2563eb' : '#64748b' }}>
              <EditIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* Print */}
          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint} sx={{ color: '#64748b' }}>
              <PrintIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* Share */}
          {typeof navigator !== 'undefined' && !!navigator.share && (
            <Tooltip title="Share">
              <IconButton size="small" onClick={handleShare} sx={{ color: '#64748b' }}>
                <ShareIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* ── Search results drawer ────────────────────────────────────────────── */}
      <Drawer
        anchor="bottom"
        open={searchDrawer}
        onClose={() => setSearchDrawer(false)}
        PaperProps={{ sx: { borderTopLeftRadius: '20px', borderTopRightRadius: '20px', maxHeight: '55vh' } }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{ width: 36, height: 4, bgcolor: 'grey.300', borderRadius: 2, mx: 'auto', mb: 2 }}
          />
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            &quot;{searchQuery}&quot; — found on {searchPages.length} page(s)
          </Typography>
          <List disablePadding>
            {searchPages.map((p, i) => (
              <ListItem
                key={p}
                button
                selected={i === searchHitIdx}
                onClick={() => jumpToSearchResult(i)}
              >
                <ListItemText primary={`Page ${p}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default PdfViewerWithAnnotations;
