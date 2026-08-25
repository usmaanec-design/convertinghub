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
import FitScreenIcon from '@mui/icons-material/FitScreen';
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

import { AnnotationStroke, PenToolType } from '../pdf/PdfAnnotationCanvas';
import { PdfPageViewItem } from './PdfPageViewItem';
import { exportModifiedPdf } from '../../pages/tools/pdf/editor/pdfExporter';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pdfTextIndexRef = useRef<Map<number, string>>(new Map());

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const [activePageNum, setActivePageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Page Base Dimensions
  const [pdfPageWidth, setPdfPageWidth] = useState<number>(612);
  const [pdfPageHeight, setPdfPageHeight] = useState<number>(792);
  const [fitWidth, setFitWidth] = useState<number>(340);

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

  // Double tap to zoom reference
  const lastTapRef = useRef<number>(0);

  // Measure fit-to-width container space
  const updateFitWidth = useCallback(() => {
    if (scrollContainerRef.current) {
      const availableWidth = scrollContainerRef.current.clientWidth - 32;
      if (availableWidth > 200) {
        setFitWidth(availableWidth);
      }
    }
  }, []);

  useEffect(() => {
    updateFitWidth();
    window.addEventListener('resize', updateFitWidth);
    return () => window.removeEventListener('resize', updateFitWidth);
  }, [updateFitWidth]);

  // Reset state when opening new file or leaving modal
  useEffect(() => {
    if (!open || !file) return;

    setError(null);
    setLoading(true);
    setActivePageNum(1);
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
      setActivePageNum(1);

      // Extract Page 1 Base Dimensions
      const firstPage = await pdf.getPage(1);
      const view = firstPage.view;
      const w = view[2] - view[0];
      const h = view[3] - view[1];
      setPdfPageWidth(w || 612);
      setPdfPageHeight(h || 792);
      updateFitWidth();
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

  // Smooth Navigation / Page Jumping
  const scrollToPage = (pNum: number) => {
    const pageEl = document.getElementById(`pdf-page-${pNum}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActivePageNum(pNum);
    }
  };

  const handlePrevPage = () => {
    if (activePageNum > 1) scrollToPage(activePageNum - 1);
  };

  const handleNextPage = () => {
    if (activePageNum < totalPages) scrollToPage(activePageNum + 1);
  };

  // Double Tap to Zoom Toggle
  const handleTouchStart = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setScale((s) => (s > 1.2 ? 1.0 : 1.75));
    }
    lastTapRef.current = now;
  };

  // Stroke change handler per page
  const handlePageStrokesChange = (pIdx: number, newStrokes: AnnotationStroke[]) => {
    const updated = { ...strokesByPage, [pIdx]: newStrokes };
    setStrokesByPage(updated);

    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(updated);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
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
      scrollToPage(matches[0].pageNum);
    }
  };

  // Export & Download
  const handleDownloadOriginal = () => {
    if (file?.fileObj) {
      const url = URL.createObjectURL(file.fileObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else if (file?.url) {
      window.open(file.url, '_blank');
    }
  };

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
        width: fitWidth * scale,
        height: (fitWidth * scale) * (pdfPageHeight / pdfPageWidth),
        aspectRatio: pdfPageWidth / (pdfPageHeight || 1),
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

  const handleShareFile = async () => {
    if (navigator.share && file) {
      try {
        if (file.fileObj) {
          await navigator.share({
            title: file.name,
            files: [file.fileObj]
          });
        } else {
          await navigator.share({
            title: file.name,
            url: file.url || window.location.href
          });
        }
      } catch (err) {
        console.log('[File Viewer] Share cancelled or unsupported:', err);
      }
    } else {
      handleDownloadOriginal();
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9',
          color: 'text.primary',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      {/* Top Mobile Viewer Header */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <IconButton onClick={onClose} size="small" edge="start">
            <CloseIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ maxWidth: 180 }}>
              {file?.name || 'Document Viewer'}
            </Typography>
            {totalPages > 0 && (
              <Typography variant="caption" color="text.secondary">
                Page {activePageNum} of {totalPages}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {file?.type === 'pdf' && (
            <>
              <IconButton size="small" onClick={() => setSearchOpen(!searchOpen)}>
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setThumbDrawerOpen(true)}>
                <ViewModuleIcon fontSize="small" />
              </IconButton>
            </>
          )}

          <IconButton size="small" onClick={handleShareFile}>
            <ShareIcon fontSize="small" />
          </IconButton>

          <Button
            variant="contained"
            size="small"
            onClick={handleExportAnnotatedPdf}
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#2563eb',
              fontSize: '0.75rem',
              px: 1.5
            }}
          >
            Save
          </Button>
        </Box>
      </Box>

      {/* Expandable Search Input Bar */}
      {searchOpen && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 9
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search text in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePerformSearch()}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <Button
            variant="contained"
            onClick={handlePerformSearch}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb' }}
          >
            Find
          </Button>
          {searchResults.length > 0 && (
            <Chip
              label={`${searchIdx + 1}/${searchResults.length}`}
              color="primary"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Paper>
      )}

      {/* Pen Annotation Toolbar */}
      {file?.type === 'pdf' && (
        <Box
          sx={{
            px: 2,
            py: 0.75,
            bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#eff6ff',
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1e293b' : '#dbeafe'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.25,
            overflowX: 'auto',
            zIndex: 8
          }}
        >
          {(['blue_pen', 'black_pen', 'red_pen', 'highlighter', 'eraser'] as PenToolType[]).map((tool) => {
            const isSelected = activePenTool === tool;
            const colors: Record<PenToolType, string> = {
              blue_pen: '#2563eb',
              black_pen: '#000000',
              red_pen: '#dc2626',
              highlighter: '#facc15',
              eraser: '#94a3b8'
            };
            return (
              <Box
                key={tool}
                onClick={() => setActivePenTool(isSelected ? null : tool)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: colors[tool],
                  border: isSelected ? '3px solid #ffffff' : '2px solid transparent',
                  boxShadow: isSelected ? '0 0 0 2px #2563eb' : 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                  '&:active': { transform: 'scale(0.85)' }
                }}
              />
            );
          })}

          <Box sx={{ width: 1, height: 20, bgcolor: '#cbd5e1', mx: 0.5 }} />

          <IconButton size="small" onClick={handleUndo} disabled={historyIdx < 0}>
            <UndoIcon fontSize="small" />
          </IconButton>

          <IconButton size="small" onClick={handleRedo} disabled={historyIdx >= history.length - 1}>
            <RedoIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* MAIN DOCUMENT VIEWPORT (Continuous Vertical Scroll) */}
      <Box
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          position: 'relative',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              my: 8,
              gap: 2
            }}
          >
            <CircularProgress size={44} sx={{ color: '#2563eb' }} />
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              Opening document with vector quality...
            </Typography>
          </Box>
        )}

        {error && (
          <Paper
            elevation={0}
            sx={{ p: 4, my: 4, borderRadius: '20px', bgcolor: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}
          >
            <Typography variant="subtitle1" fontWeight={700} color="#dc2626" gutterBottom>
              {error}
            </Typography>
            <Button variant="outlined" onClick={handleDownloadOriginal} sx={{ borderRadius: '20px', mt: 1 }}>
              Download Original File
            </Button>
          </Paper>
        )}

        {/* IMAGE VIEWER */}
        {!loading && file?.type === 'image' && imageUrl && (
          <Box sx={{ width: '100%', maxWidth: 600, textAlign: 'center', my: 'auto' }}>
            <img
              src={imageUrl}
              alt={file.name}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                objectFit: 'contain'
              }}
            />
          </Box>
        )}

        {/* CONTINUOUS VERTICAL SCROLL PDF VIEWER */}
        {!loading && file?.type === 'pdf' && pdfDoc && (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <PdfPageViewItem
                key={pNum}
                pageIndex={pNum}
                pdfDoc={pdfDoc}
                fitWidth={fitWidth}
                scale={scale}
                pdfPageWidth={pdfPageWidth}
                pdfPageHeight={pdfPageHeight}
                activePenTool={activePenTool}
                strokes={strokesByPage[pNum] || []}
                onStrokesChange={(newStrokes) => handlePageStrokesChange(pNum, newStrokes)}
                onPageVisible={(visiblePage) => setActivePageNum(visiblePage)}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* FLOATING BOTTOM CONTROLS BAR */}
      {file?.type === 'pdf' && totalPages > 0 && (
        <Paper
          elevation={8}
          sx={{
            px: 2,
            py: 1,
            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10
          }}
        >
          {/* Zoom Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small" onClick={() => setScale((s) => Math.max(0.6, s - 0.25))}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" fontWeight={800} sx={{ minWidth: 40, textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </Typography>
            <IconButton size="small" onClick={() => setScale((s) => Math.min(2.5, s + 0.25))}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setScale(1.0)} title="Fit to width">
              <FitScreenIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Page Jump Secondary Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={handlePrevPage} disabled={activePageNum <= 1}>
              <NavigateBeforeIcon />
            </IconButton>
            <Typography variant="caption" fontWeight={800} color="text.secondary">
              {activePageNum} / {totalPages}
            </Typography>
            <IconButton size="small" onClick={handleNextPage} disabled={activePageNum >= totalPages}>
              <NavigateNextIcon />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* PAGE THUMBNAILS DRAWER */}
      <Drawer anchor="bottom" open={thumbDrawerOpen} onClose={() => setThumbDrawerOpen(false)}>
        <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff', maxHeight: '50vh' }}>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>
            Page Thumbnails ({totalPages})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', py: 1 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <Box
                key={pNum}
                onClick={() => {
                  scrollToPage(pNum);
                  setThumbDrawerOpen(false);
                }}
                sx={{
                  flexShrink: 0,
                  width: 80,
                  height: 110,
                  borderRadius: '8px',
                  bgcolor: pNum === activePageNum ? '#eff6ff' : '#f8fafc',
                  border: `2px solid ${pNum === activePageNum ? '#2563eb' : '#e2e8f0'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {thumbnails[pNum - 1] ? (
                  <img
                    src={thumbnails[pNum - 1]}
                    alt={`Page ${pNum}`}
                    style={{ width: '100%', height: '80%', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography variant="caption" fontWeight={700}>
                    Page {pNum}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Drawer>
    </Dialog>
  );
};

export default MobileFileViewerModal;
