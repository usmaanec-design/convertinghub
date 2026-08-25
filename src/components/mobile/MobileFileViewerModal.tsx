import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  useTheme,
  Chip,
  Paper,
  TextField,
  Tooltip,
  Drawer
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

import {
  PdfAnnotationCanvas,
  AnnotationStroke,
  PenToolType
} from '../pdf/PdfAnnotationCanvas';
import { exportModifiedPdf } from '../../pages/tools/pdf/editor/pdfExporter';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface FileToView {
  name: string;
  url?: string;
  fileObj?: File;
  type: 'pdf' | 'image' | 'text' | 'other';
  size?: string;
}

interface MobileFileViewerModalProps {
  open: boolean;
  file: FileToView | null;
  onClose: () => void;
}

export const MobileFileViewerModal: React.FC<MobileFileViewerModalProps> = ({
  open,
  file,
  onClose
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRenderTaskRef = useRef<any>(null);
  const pdfTextIndexRef = useRef<Map<number, string>>(new Map());

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Page Dimensions
  const [pdfPageWidth, setPdfPageWidth] = useState<number>(612);
  const [pdfPageHeight, setPdfPageHeight] = useState<number>(792);
  const [containerDim, setContainerDim] = useState<{ width: number; height: number }>({
    width: 360,
    height: 480
  });

  // Annotation Tool & History State
  const [activePenTool, setActivePenTool] = useState<PenToolType | null>(null);
  const [strokesByPage, setStrokesByPage] = useState<Record<number, AnnotationStroke[]>>({});
  const [history, setHistory] = useState<Record<number, AnnotationStroke[]>[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  // Search State
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ pageNum: number; text: string }[]>([]);
  const [searchIdx, setSearchIdx] = useState<number>(0);

  // Thumbnail Drawer
  const [thumbDrawerOpen, setThumbDrawerOpen] = useState<boolean>(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  // Reset state when opening new file or leaving modal
  useEffect(() => {
    if (!open || !file) {
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (e) {}
        activeRenderTaskRef.current = null;
      }
      return;
    }

    setError(null);
    setLoading(true);
    setPageNum(1);
    setScale(1.0);
    setActivePenTool(null);
    setStrokesByPage({});
    setHistory([]);
    setHistoryIdx(-1);
    pdfTextIndexRef.current.clear();

    if (file.type === 'image') {
      if (file.fileObj) {
        setImageUrl(URL.createObjectURL(file.fileObj));
      } else if (file.url) {
        setImageUrl(file.url);
      }
      setLoading(false);
    } else if (file.type === 'pdf') {
      loadPdfDocument(file);
    } else {
      setLoading(false);
    }
  }, [open, file]);

  const loadPdfDocument = async (targetFile: FileToView) => {
    try {
      let buffer: ArrayBuffer | null = null;
      if (targetFile.fileObj) {
        buffer = await targetFile.fileObj.arrayBuffer();
      } else if (targetFile.url) {
        const res = await fetch(targetFile.url);
        buffer = await res.arrayBuffer();
      }

      if (!buffer) {
        throw new Error('Could not read PDF file buffer.');
      }

      setOriginalBuffer(buffer);
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
        cMapPacked: true
      });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setPageNum(1);
    } catch (err: any) {
      console.warn('[File Viewer] Failed to load PDF:', err);
      setError('Could not render PDF document.');
    } finally {
      setLoading(false);
    }
  };

  // Lazy Thumbnail generation only when thumbnail drawer is opened
  useEffect(() => {
    if (!thumbDrawerOpen || !pdfDoc || thumbnails.length > 0) return;

    let isCancelled = false;
    const generateThumbnails = async () => {
      const thumbs: string[] = [];
      const count = Math.min(pdfDoc.numPages, 30);
      for (let i = 1; i <= count; i++) {
        if (isCancelled) break;
        try {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.2 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await (page.render as any)({ canvasContext: ctx, viewport }).promise;
            if (!isCancelled) thumbs.push(canvas.toDataURL('image/jpeg', 0.6));
          }
        } catch {
          thumbs.push('');
        }
      }
      if (!isCancelled) setThumbnails(thumbs);
    };

    generateThumbnails();

    return () => {
      isCancelled = true;
    };
  }, [thumbDrawerOpen, pdfDoc, thumbnails]);

  // Render Page with Task Cancellation and DPR Capping
  useEffect(() => {
    if (pdfDoc && pageNum > 0 && canvasRef.current) {
      renderPdfPage(pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale]);

  const renderPdfPage = async (num: number, currentScale: number) => {
    if (!pdfDoc) return;

    // Cancel previous ongoing render task if active
    if (activeRenderTaskRef.current) {
      try {
        activeRenderTaskRef.current.cancel();
      } catch (e) {}
      activeRenderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(num);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const viewport = page.getViewport({ scale: currentScale * dpr });

      setPdfPageWidth(page.view[2] - page.view[0]);
      setPdfPageHeight(page.view[3] - page.view[1]);

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        setContainerDim({ width: Math.floor(viewport.width / dpr), height: Math.floor(viewport.height / dpr) });

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const renderTask = (page.render as any)({ canvasContext: ctx, viewport });
          activeRenderTaskRef.current = renderTask;
          await renderTask.promise;
          activeRenderTaskRef.current = null;
        }
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('[File Viewer] Error rendering page:', err);
      }
    }
  };

  // Undo / Redo for Stroke Annotations
  const updateStrokesForCurrentPage = (newStrokes: AnnotationStroke[]) => {
    const updated = { ...strokesByPage, [pageNum - 1]: newStrokes };
    setStrokesByPage(updated);

    const nextHist = history.slice(0, historyIdx + 1);
    nextHist.push(updated);
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setStrokesByPage(history[prevIdx]);
      setHistoryIdx(prevIdx);
    } else if (historyIdx === 0) {
      setStrokesByPage({});
      setHistoryIdx(-1);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setStrokesByPage(history[nextIdx]);
      setHistoryIdx(nextIdx);
    }
  };

  // Cached Search Logic
  const handlePerformSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    const matches: { pageNum: number; text: string }[] = [];
    const queryLower = searchQuery.toLowerCase();

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      let pageText = pdfTextIndexRef.current.get(i) || '';
      if (!pageText) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        pageText = textContent.items.map((item: any) => item.str).join(' ');
        pdfTextIndexRef.current.set(i, pageText);
      }

      if (pageText.toLowerCase().includes(queryLower)) {
        matches.push({ pageNum: i, text: pageText });
      }
    }

    setSearchResults(matches);
    setSearchIdx(0);
    if (matches.length > 0) {
      setPageNum(matches[0].pageNum);
    }
  };

  // Double tap to zoom
  const lastTapRef = useRef<number>(0);
  const handleTouchStart = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setScale((s) => (s > 1.2 ? 1.0 : 1.8));
    }
    lastTapRef.current = now;
  };

  // Export Annotated PDF
  const handleExportAnnotatedPdf = async () => {
    if (!originalBuffer || !pdfDoc) {
      handleDownloadOriginal();
      return;
    }

    try {
      const pagesObj = Array.from({ length: totalPages }, (_, i) => ({
        pageIndex: i,
        originalRotation: 0,
        rotation: 0,
        width: containerDim.width,
        height: containerDim.height,
        aspectRatio: containerDim.width / (containerDim.height || 1),
        pdfPageWidth,
        pdfPageHeight
      }));

      const exportedBytes = await exportModifiedPdf({
        originalPdfBuffer: originalBuffer,
        pages: pagesObj,
        textItems: {},
        shapeItems: {},
        imageItems: {},
        annotationStrokes: strokesByPage,
        whiteoutRects: {}
      });

      const blob = new Blob([exportedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file?.name.replace('.pdf', '')}_annotated.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[File Viewer] Failed to export annotated PDF:', err);
      handleDownloadOriginal();
    }
  };

  const handleDownloadOriginal = () => {
    if (!file) return;
    if (file.fileObj) {
      const url = URL.createObjectURL(file.fileObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.click();
    }
  };

  const handleShare = () => {
    if (file?.fileObj && navigator.share) {
      navigator.share({ files: [file.fileObj], title: file.name }).catch(() => {});
    }
  };

  if (!open || !file) return null;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#0f172a',
          color: '#ffffff',
          m: 0,
          borderRadius: 0
        }
      }}
    >
      {/* Top Navigation Bar */}
      <Box
        sx={{
          height: 56,
          px: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#1e293b',
          borderBottom: '1px solid #334155',
          zIndex: 100
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <IconButton size="small" onClick={onClose} sx={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: 180 }}>
            {file.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {file.type === 'pdf' && (
            <>
              <Tooltip title="Thumbnails">
                <IconButton
                  size="small"
                  onClick={() => setThumbDrawerOpen(true)}
                  sx={{ color: '#ffffff' }}
                >
                  <ViewModuleIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="In-PDF Search">
                <IconButton
                  size="small"
                  onClick={() => setSearchOpen(!searchOpen)}
                  sx={{ color: searchOpen ? '#3b82f6' : '#ffffff' }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </>
          )}

          {file.type === 'pdf' && (
            <Button
              variant={activePenTool ? 'contained' : 'outlined'}
              size="small"
              startIcon={<EditIcon />}
              onClick={() => setActivePenTool(activePenTool ? null : 'blue_pen')}
              sx={{
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                bgcolor: activePenTool ? '#2563eb' : 'transparent',
                borderColor: '#475569',
                color: '#ffffff'
              }}
            >
              Annotate
            </Button>
          )}

          <IconButton size="small" onClick={handleExportAnnotatedPdf} sx={{ color: '#ffffff' }}>
            <DownloadIcon />
          </IconButton>

          <IconButton size="small" onClick={handleShare} sx={{ color: '#ffffff' }}>
            <ShareIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Search Header Bar */}
      {searchOpen && file.type === 'pdf' && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: '#1e293b',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <TextField
            autoFocus
            size="small"
            placeholder="Search text in PDF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePerformSearch()}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0f172a',
                color: '#ffffff',
                borderRadius: '12px'
              }
            }}
          />
          <Button variant="contained" size="small" onClick={handlePerformSearch}>
            Search
          </Button>

          {searchResults.length > 0 && (
            <Typography variant="caption" color="grey.400">
              {searchIdx + 1}/{searchResults.length}
            </Typography>
          )}
        </Box>
      )}

      {/* Main Viewer Display Area */}
      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'auto',
          p: 1
        }}
      >
        {loading ? (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#2563eb', mb: 1 }} />
            <Typography variant="body2" color="grey.400">
              Loading document...
            </Typography>
          </Box>
        ) : error ? (
          <Paper
            elevation={0}
            sx={{ p: 3, textAlign: 'center', bgcolor: '#1e293b', color: '#ffffff' }}
          >
            <InsertDriveFileIcon sx={{ fontSize: 48, color: '#ef4444', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {error}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleDownloadOriginal}
              sx={{ mt: 2, bgcolor: '#2563eb' }}
            >
              Download Original File
            </Button>
          </Paper>
        ) : file.type === 'pdf' ? (
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              borderRadius: '8px',
              overflow: 'hidden',
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease'
            }}
          >
            <canvas ref={canvasRef} style={{ display: 'block' }} />

            {/* Handwriting Annotation Canvas Layer */}
            {activePenTool && (
              <PdfAnnotationCanvas
                pageIndex={pageNum - 1}
                width={containerDim.width}
                height={containerDim.height}
                activeTool={activePenTool}
                strokes={strokesByPage[pageNum - 1] || []}
                onStrokesChange={updateStrokesForCurrentPage}
              />
            )}
          </Box>
        ) : file.type === 'image' && imageUrl ? (
          <img
            src={imageUrl}
            alt={file.name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${scale})`,
              transition: 'transform 0.15s ease'
            }}
          />
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#1e293b', color: '#ffffff' }}>
            <InsertDriveFileIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Preview not available for this format.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleDownloadOriginal}
              sx={{ mt: 2, bgcolor: '#2563eb' }}
            >
              Open / Download
            </Button>
          </Paper>
        )}
      </Box>

      {/* Floating Bottom Control Bar */}
      {file.type === 'pdf' && totalPages > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: '#1e293b',
            color: '#ffffff',
            borderRadius: '24px',
            px: 2,
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 100,
            border: '1px solid #334155'
          }}
        >
          <IconButton
            size="small"
            disabled={pageNum <= 1}
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            sx={{ color: '#ffffff' }}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <Typography variant="caption" fontWeight={700}>
            {pageNum} / {totalPages}
          </Typography>

          <IconButton
            size="small"
            disabled={pageNum >= totalPages}
            onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
            sx={{ color: '#ffffff' }}
          >
            <NavigateNextIcon />
          </IconButton>

          <Box sx={{ width: 1, height: 20, bgcolor: 'grey.700', mx: 0.5 }} />

          <IconButton size="small" onClick={() => setScale((s) => Math.max(0.6, s - 0.2))} sx={{ color: '#ffffff' }}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" fontWeight={700}>
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton size="small" onClick={() => setScale((s) => Math.min(2.5, s + 0.2))} sx={{ color: '#ffffff' }}>
            <ZoomInIcon fontSize="small" />
          </IconButton>

          {activePenTool && (
            <>
              <Box sx={{ width: 1, height: 20, bgcolor: 'grey.700', mx: 0.5 }} />
              <IconButton size="small" disabled={historyIdx < 0} onClick={handleUndo} sx={{ color: '#ffffff' }}>
                <UndoIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" disabled={historyIdx >= history.length - 1} onClick={handleRedo} sx={{ color: '#ffffff' }}>
                <RedoIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Paper>
      )}

      {/* Lazy Page Thumbnails Drawer */}
      <Drawer
        anchor="bottom"
        open={thumbDrawerOpen}
        onClose={() => setThumbDrawerOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: '#ffffff',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            p: 2,
            maxHeight: '40vh'
          }
        }}
      >
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
          Page Thumbnails ({totalPages})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', py: 1 }}>
          {thumbnails.map((thumb, idx) => (
            <Box
              key={idx}
              onClick={() => {
                setPageNum(idx + 1);
                setThumbDrawerOpen(false);
              }}
              sx={{
                width: 80,
                height: 110,
                borderRadius: '8px',
                overflow: 'hidden',
                border: `2px solid ${pageNum === idx + 1 ? '#2563eb' : 'transparent'}`,
                cursor: 'pointer',
                bgcolor: '#0f172a',
                flexShrink: 0
              }}
            >
              {thumb ? (
                <img src={thumb} alt={`Page ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="caption" color="grey.500">
                    {idx + 1}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Drawer>
    </Dialog>
  );
};

export default MobileFileViewerModal;
