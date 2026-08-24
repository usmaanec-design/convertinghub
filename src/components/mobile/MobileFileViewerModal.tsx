import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  useTheme,
  Chip,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

// Set local PDF.js worker
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

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !file) return;

    setError(null);
    setLoading(true);
    setPageNum(1);
    setScale(1.0);

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
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        }
      }
    } catch (err) {
      console.error('[File Viewer] Error rendering page:', err);
    }
  };

  const handlePrevPage = () => {
    if (pageNum > 1) setPageNum((p) => p - 1);
  };

  const handleNextPage = () => {
    if (pageNum < totalPages) setPageNum((p) => p + 1);
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(2.5, s + 0.25));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(0.5, s - 0.25));
  };

  const handleDownload = () => {
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

  if (!open || !file) return null;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#f1f5f9',
          color: '#0f172a',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Light Mode Header Bar */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <InsertDriveFileIcon sx={{ color: '#2563eb' }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" noWrap>
              {file.name}
            </Typography>
            {file.size && (
              <Typography variant="caption" color="#64748b">
                {file.size}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleDownload} sx={{ color: '#2563eb' }}>
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Light Mode Document Viewport Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          overflow: 'auto',
          position: 'relative',
          bgcolor: '#f8fafc'
        }}
      >
        {loading && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={44} sx={{ color: '#2563eb', mb: 2 }} />
            <Typography variant="body2" color="#64748b">
              Loading preview...
            </Typography>
          </Box>
        )}

        {error && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '16px',
              textAlign: 'center',
              maxWidth: 320
            }}
          >
            <Typography variant="body2" color="#dc2626" fontWeight={700} gutterBottom>
              {error}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDownload}
              startIcon={<DownloadIcon />}
              sx={{ color: '#2563eb', borderColor: '#2563eb', mt: 1, textTransform: 'none' }}
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
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              bgcolor: '#ffffff',
              transform: `scale(${scale})`,
              transition: 'transform 0.2s ease'
            }}
          />
        )}

        {!loading && !error && file?.type === 'pdf' && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto',
              maxHeight: '100%',
              maxWidth: '100%',
              borderRadius: '12px',
              bgcolor: '#ffffff',
              p: 1.5,
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}
          >
            <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
          </Box>
        )}
      </Box>

      {/* Light Mode Toolbar Footer */}
      {!loading && !error && file?.type === 'pdf' && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={handlePrevPage}
              disabled={pageNum <= 1}
              sx={{ color: '#0f172a' }}
            >
              <NavigateBeforeIcon />
            </IconButton>
            <Typography variant="caption" fontWeight={700} color="#0f172a">
              Page {pageNum} of {totalPages}
            </Typography>
            <IconButton
              size="small"
              onClick={handleNextPage}
              disabled={pageNum >= totalPages}
              sx={{ color: '#0f172a' }}
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#0f172a' }}>
              <ZoomOutIcon />
            </IconButton>
            <Chip
              label={`${Math.round(scale * 100)}%`}
              size="small"
              sx={{ bgcolor: '#f1f5f9', color: '#0f172a', fontWeight: 'bold' }}
            />
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#0f172a' }}>
              <ZoomInIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default MobileFileViewerModal;
