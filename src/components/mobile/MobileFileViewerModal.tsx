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

  // Reset state when opening new file
  useEffect(() => {
    if (!open || !file) return;

    setError(null);
    setLoading(true);
    setPageNum(1);
    setScale(1.0);
    setActivePenTool(null);
    setStrokesByPage({});
    setHistory([]);
    setHistoryIdx(-1);

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

      // Generate Page Thumbnails asynchronously
      generateThumbnails(pdf);
    } catch (err: any) {
      console.warn('[File Viewer] Failed to load PDF:', err);
      setError('Could not render PDF document.');
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnails = async (pdf: any) => {
    const thumbs: string[] = [];
    const count = Math.min(pdf.numPages, 30);
    for (let i = 1; i <= count; i++) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          thumbs.push(canvas.toDataURL());
        }
      } catch {
        thumbs.push('');
      }
    }
    setThumbnails(thumbs);
  };

  // Render Page
  useEffect(() => {
    if (pdfDoc && pageNum > 0 && canvasRef.current) {
      renderPdfPage(pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale]);

  const renderPdfPage = async (num: number, currentScale: number) => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale: currentScale });

      setPdfPageWidth(page.view[2] - page.view[0]);
      setPdfPageHeight(page.view[3] - page.view[1]);

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setContainerDim({ width: viewport.width, height: viewport.height });

        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        }
      }
    } catch (err) {
      console.error('[File Viewer] Error rendering page:', err);
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

  // Search Logic
  const handlePerformSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    const matches: { pageNum: number; text: string }[] = [];
    const queryLower = searchQuery.toLowerCase();

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
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
      // Double tap detected
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
      const pagesMeta = Array.from({ length: totalPages }, (_, i) => ({
        pageIndex: i,
        originalRotation: 0,
        rotation: 0,
        width: containerDim.width,
        height: containerDim.height,
        aspectRatio: containerDim.width / containerDim.height,
        pdfPageWidth,
        pdfPageHeight
      }));

      const exportedBytes = await exportModifiedPdf({
        originalPdfBuffer: originalBuffer,
        pages: pagesMeta,
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
      const baseName = file?.name?.replace(/\.pdf$/i, '') || 'document';
      a.download = `${baseName}_annotated.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Failed to export annotated PDF, falling back to original:', err);
      handleDownloadOriginal();
    }
  };

  const handleDownloadOriginal = () => {
    if (!file) return;
    if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.click();
    } else if (file.fileObj) {
      const url = URL.createObjectURL(file.fileObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = async () => {
    if (navigator.share && file?.fileObj) {
      try {
        await navigator.share({
          files: [file.fileObj],
          title: file.name
        });
      } catch (e) {
        console.warn('Share cancelled or unavailable:', e);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!open || !file) return null;

  const currentPageStrokes = strokesByPage[pageNum - 1] || [];

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <InsertDriveFileIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="subtitle2" fontWeight={800} color="#ffffff" noWrap>
            {file.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {file.type === 'pdf' && (
            <>
              <Tooltip title="In-PDF Search">
                <IconButton
                  size="small"
                  onClick={() => setSearchOpen(!searchOpen)}
                  sx={{ color: searchOpen ? '#3b82f6' : '#94a3b8' }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Thumbnails">
                <IconButton
                  size="small"
                  onClick={() => setThumbDrawerOpen(true)}
                  sx={{ color: '#94a3b8' }}
                >
                  <ViewModuleIcon />
                </IconButton>
              </Tooltip>
            </>
          )}

          <Tooltip title="Share">
            <IconButton size="small" onClick={handleShare} sx={{ color: '#94a3b8' }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint} sx={{ color: '#94a3b8' }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Annotated File">
            <IconButton size="small" onClick={handleExportAnnotatedPdf} sx={{ color: '#3b82f6' }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* In-PDF Search Bar */}
      {searchOpen && (
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
            size="small"
            placeholder="Search inside PDF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePerformSearch()}
            sx={{
              flex: 1,
              bgcolor: '#0f172a',
              borderRadius: '8px',
              input: { color: '#ffffff', py: 0.75, px: 1.5 }
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handlePerformSearch}
            sx={{ bgcolor: '#2563eb', textTransform: 'none' }}
          >
            Find
          </Button>
          {searchResults.length > 0 && (
            <Typography variant="caption" color="#94a3b8">
              {searchResults.length} matches
            </Typography>
          )}
        </Box>
      )}

      {/* Pen Annotation Toolbar */}
      {file.type === 'pdf' && (
        <Box
          sx={{
            px: 2,
            py: 0.75,
            bgcolor: '#0f172a',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            overflowX: 'auto'
          }}
        >
          <Chip
            label="Blue Pen"
            size="small"
            clickable
            onClick={() =>
              setActivePenTool(activePenTool === 'blue_pen' ? null : 'blue_pen')
            }
            sx={{
              bgcolor: activePenTool === 'blue_pen' ? '#2563eb' : '#1e293b',
              color: '#ffffff',
              fontWeight: 700
            }}
          />
          <Chip
            label="Black Pen"
            size="small"
            clickable
            onClick={() =>
              setActivePenTool(activePenTool === 'black_pen' ? null : 'black_pen')
            }
            sx={{
              bgcolor: activePenTool === 'black_pen' ? '#000000' : '#1e293b',
              color: '#ffffff',
              border: activePenTool === 'black_pen' ? '1px solid #ffffff' : 'none',
              fontWeight: 700
            }}
          />
          <Chip
            label="Red Pen"
            size="small"
            clickable
            onClick={() =>
              setActivePenTool(activePenTool === 'red_pen' ? null : 'red_pen')
            }
            sx={{
              bgcolor: activePenTool === 'red_pen' ? '#dc2626' : '#1e293b',
              color: '#ffffff',
              fontWeight: 700
            }}
          />
          <Chip
            label="Highlighter"
            size="small"
            clickable
            onClick={() =>
              setActivePenTool(
                activePenTool === 'highlighter' ? null : 'highlighter'
              )
            }
            sx={{
              bgcolor: activePenTool === 'highlighter' ? '#eab308' : '#1e293b',
              color: '#000000',
              fontWeight: 700
            }}
          />
          <Chip
            label="Eraser"
            size="small"
            clickable
            onClick={() =>
              setActivePenTool(activePenTool === 'eraser' ? null : 'eraser')
            }
            sx={{
              bgcolor: activePenTool === 'eraser' ? '#64748b' : '#1e293b',
              color: '#ffffff',
              fontWeight: 700
            }}
          />

          <Box sx={{ width: 1, height: 16, bgcolor: '#334155', mx: 0.5 }} />

          <IconButton
            size="small"
            onClick={handleUndo}
            disabled={historyIdx < 0}
            sx={{ color: '#94a3b8' }}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            sx={{ color: '#94a3b8' }}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Main Document Display Canvas Area */}
      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          overflow: 'auto',
          position: 'relative',
          bgcolor: '#020617'
        }}
      >
        {loading && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={44} sx={{ color: '#2563eb', mb: 2 }} />
            <Typography variant="body2" color="#94a3b8">
              Loading document preview...
            </Typography>
          </Box>
        )}

        {error && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: '#450a0a',
              border: '1px solid #991b1b',
              borderRadius: '16px',
              textAlign: 'center',
              maxWidth: 320
            }}
          >
            <Typography variant="body2" color="#fca5a5" fontWeight={700} gutterBottom>
              {error}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDownloadOriginal}
              startIcon={<DownloadIcon />}
              sx={{ color: '#3b82f6', borderColor: '#3b82f6', mt: 1, textTransform: 'none' }}
            >
              Download File Directly
            </Button>
          </Paper>
        )}

        {!loading && !error && file?.type === 'image' && imageUrl && (
          <Box
            component="img"
            src={imageUrl}
            alt={file.name}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              transform: `scale(${scale})`,
              transition: 'transform 0.2s ease'
            }}
          />
        )}

        {!loading && !error && file?.type === 'pdf' && (
          <Box
            sx={{
              position: 'relative',
              borderRadius: '12px',
              bgcolor: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            <canvas ref={canvasRef} style={{ display: 'block' }} />

            {/* Interactive Handwriting Annotation Overlay Canvas */}
            <PdfAnnotationCanvas
              pageIndex={pageNum - 1}
              pdfPageWidth={pdfPageWidth}
              pdfPageHeight={pdfPageHeight}
              containerWidth={containerDim.width}
              containerHeight={containerDim.height}
              activeTool={activePenTool}
              strokes={currentPageStrokes}
              onStrokesChange={updateStrokesForCurrentPage}
            />
          </Box>
        )}
      </Box>

      {/* Navigation Footer */}
      {!loading && !error && file?.type === 'pdf' && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: '#1e293b',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => pageNum > 1 && setPageNum((p) => p - 1)}
              disabled={pageNum <= 1}
              sx={{ color: '#ffffff' }}
            >
              <NavigateBeforeIcon />
            </IconButton>
            <Typography variant="caption" fontWeight={700} color="#ffffff">
              Page {pageNum} of {totalPages}
            </Typography>
            <IconButton
              size="small"
              onClick={() => pageNum < totalPages && setPageNum((p) => p + 1)}
              disabled={pageNum >= totalPages}
              sx={{ color: '#ffffff' }}
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
              sx={{ color: '#ffffff' }}
            >
              <ZoomOutIcon />
            </IconButton>
            <Chip
              label={`${Math.round(scale * 100)}%`}
              size="small"
              sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 'bold' }}
            />
            <IconButton
              size="small"
              onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
              sx={{ color: '#ffffff' }}
            >
              <ZoomInIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Page Thumbnail Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={thumbDrawerOpen}
        onClose={() => setThumbDrawerOpen(false)}
        PaperProps={{
          sx: { width: 140, bgcolor: '#1e293b', p: 1.5, gap: 1.5 }
        }}
      >
        <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ mb: 1 }}>
          PAGES ({totalPages})
        </Typography>
        {thumbnails.map((src, i) => (
          <Paper
            key={i}
            elevation={0}
            onClick={() => {
              setPageNum(i + 1);
              setThumbDrawerOpen(false);
            }}
            sx={{
              p: 0.5,
              borderRadius: '8px',
              border: i + 1 === pageNum ? '2px solid #3b82f6' : '1px solid #334155',
              cursor: 'pointer',
              bgcolor: '#0f172a',
              textAlign: 'center'
            }}
          >
            {src ? (
              <img src={src} alt={`Page ${i + 1}`} style={{ width: '100%', borderRadius: 4 }} />
            ) : (
              <Typography variant="caption" color="#94a3b8">
                Page {i + 1}
              </Typography>
            )}
          </Paper>
        ))}
      </Drawer>
    </Dialog>
  );
};

export default MobileFileViewerModal;
