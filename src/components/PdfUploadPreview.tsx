import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Paper, Stack, Chip, CircularProgress } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfUploadPreviewProps {
  file: File;
  onRemove: () => void;
}

export const PdfUploadPreview: React.FC<PdfUploadPreviewProps> = ({ file, onRemove }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    const renderFirstPage = async () => {
      try {
        setLoading(true);
        setRenderError(false);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (isCancelled) return;
        setPageCount(pdf.numPages);

        const page = await pdf.getPage(1);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 0.5 });
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        };

        await page.render(renderContext).promise;
        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.warn('[PdfUploadPreview] First page preview render warning:', err);
        if (!isCancelled) {
          setRenderError(true);
          setLoading(false);
        }
      }
    };

    renderFirstPage();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        width: '100%',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        my: 2
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
        {/* Left: First page preview thumbnail */}
        <Box
          sx={{
            width: 130,
            height: 160,
            bgcolor: 'action.hover',
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: 1,
            position: 'relative'
          }}
        >
          {loading && <CircularProgress size={24} />}
          {renderError && (
            <Stack alignItems="center" spacing={0.5}>
              <InsertDriveFileIcon color="action" sx={{ fontSize: 40 }} />
              <Typography variant="caption" color="text.secondary">PDF File</Typography>
            </Stack>
          )}
          <canvas
            ref={canvasRef}
            style={{
              display: loading || renderError ? 'none' : 'block',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>

        {/* Center: File metadata */}
        <Box flex={1} textAlign={{ xs: 'center', sm: 'left' }}>
          <Chip
            label="Uploaded PDF"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mb: 1, fontWeight: 'bold' }}
          />
          <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ maxWidth: 350 }}>
            {file.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {pageCount ? `${pageCount} pages` : 'Reading pages...'} • {formatFileSize(file.size)}
          </Typography>
        </Box>

        {/* Right: Remove button */}
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteOutlineIcon />}
          onClick={onRemove}
          sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}
        >
          Remove
        </Button>
      </Stack>
    </Paper>
  );
};
