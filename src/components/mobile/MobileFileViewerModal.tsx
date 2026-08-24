import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PdfViewerWithAnnotations from './PdfViewerWithAnnotations';


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

  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !file) return;
    setError(null);
    setLoading(false);
    setImageUrl(null);

    if (file.type === 'image') {
      setLoading(true);
      if (file.fileObj) {
        setImageUrl(URL.createObjectURL(file.fileObj));
      } else if (file.url) {
        setImageUrl(file.url);
      }
      setLoading(false);
    }
  }, [open, file]);

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
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          flexShrink: 0
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
          {/* Only show download for non-PDF (PDF viewer has its own export) */}
          {file.type !== 'pdf' && (
            <IconButton onClick={handleDownload} sx={{ color: '#2563eb' }}>
              <DownloadIcon />
            </IconButton>
          )}
          <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* ── Content Area ──────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* PDF: delegate to full-featured viewer */}
        {file.type === 'pdf' && (
          <PdfViewerWithAnnotations
            fileObj={file.fileObj instanceof File ? file.fileObj : undefined}
            fileUrl={file.url}
            fileName={file.name}
          />
        )}

        {/* Image viewer */}
        {file.type === 'image' && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              overflow: 'auto',
              bgcolor: '#f8fafc'
            }}
          >
            {loading && <CircularProgress size={40} sx={{ color: '#2563eb' }} />}
            {!loading && imageUrl && (
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
                  bgcolor: '#ffffff'
                }}
              />
            )}
          </Box>
        )}

        {/* Other file types */}
        {file.type !== 'pdf' && file.type !== 'image' && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3
            }}
          >
            {error ? (
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
                  Download File
                </Button>
              </Paper>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <InsertDriveFileIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                <Typography variant="body2" color="#64748b" gutterBottom>
                  Preview not available for this file type.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleDownload}
                  startIcon={<DownloadIcon />}
                  sx={{ bgcolor: '#2563eb', borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}
                >
                  Download File
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default MobileFileViewerModal;
