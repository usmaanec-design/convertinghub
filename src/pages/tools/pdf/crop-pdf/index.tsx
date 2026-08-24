import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Paper,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CropIcon from '@mui/icons-material/Crop';
import { PDFDocument } from 'pdf-lib';
import { useAuth } from '../../../../contexts/AuthContext';
import { executeProtectedDownload } from '../../../../utils/downloadInterceptor';
import { usePendingConversionFile } from '../../../../hooks';

export default function CropPdf() {
  const [file, setFile] = useState<File | null>(null);
  usePendingConversionFile(file, setFile);
  const [marginTop, setMarginTop] = useState<number>(20);
  const [marginBottom, setMarginBottom] = useState<number>(20);
  const [marginLeft, setMarginLeft] = useState<number>(20);
  const [marginRight, setMarginRight] = useState<number>(20);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
      setFile(uploaded);
      setConvertedBlob(null);
      setError(null);
    }
  };

  const handleCrop = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const x = marginLeft;
        const y = marginBottom;
        const newWidth = Math.max(10, width - marginLeft - marginRight);
        const newHeight = Math.max(10, height - marginTop - marginBottom);

        page.setCropBox(x, y, newWidth, newHeight);
      });

      const pdfBytes = await pdfDoc.save();
      setConvertedBlob(
        new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      );
    } catch (err: any) {
      setError(`Failed to crop PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const { isAuthenticated, signInWithGoogle } = useAuth();

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    executeProtectedDownload(
      () => {
        const url = URL.createObjectURL(convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.replace(/\.pdf$/i, '')}_cropped.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      { isAuthenticated, signInWithGoogle }
    );
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 3, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <CropIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            Crop PDF
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Crop margins of PDF documents or select specific areas, then apply
          changes to all pages.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            border: '2px dashed',
            borderColor: file ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 4,
            width: '100%',
            bgcolor: 'action.hover',
            cursor: 'pointer'
          }}
          component="label"
        >
          <input type="file" accept=".pdf" hidden onChange={handleFileUpload} />
          <UploadFileIcon
            sx={{
              fontSize: 48,
              color: file ? 'primary.main' : 'text.secondary',
              mb: 1
            }}
          />
          <Typography variant="subtitle1" fontWeight="bold">
            {file ? file.name : 'Click to select or drop a PDF file here'}
          </Typography>
        </Box>

        {file && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Top Margin (px)"
                type="number"
                value={marginTop}
                onChange={(e) => setMarginTop(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Bottom Margin (px)"
                type="number"
                value={marginBottom}
                onChange={(e) => setMarginBottom(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Left Margin (px)"
                type="number"
                value={marginLeft}
                onChange={(e) => setMarginLeft(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Right Margin (px)"
                type="number"
                value={marginRight}
                onChange={(e) => setMarginRight(Number(e.target.value))}
                fullWidth
              />
            </Grid>
          </Grid>
        )}

        {file && !convertedBlob && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCrop}
            disabled={isProcessing}
            startIcon={
              isProcessing ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
            fullWidth
          >
            {isProcessing ? 'Cropping PDF...' : 'Crop PDF Margins'}
          </Button>
        )}

        {convertedBlob && (
          <Alert severity="success" sx={{ width: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              PDF Cropped Successfully!
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 1 }}
            >
              Download Cropped PDF
            </Button>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
