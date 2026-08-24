import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ImageIcon from '@mui/icons-material/Image';
import { jsPDF } from 'jspdf';
import { usePendingConversionFile } from '../../../../hooks';

export default function JpgToPdf() {
  const [file, setFile] = useState<File | null>(null);
  usePendingConversionFile(file, setFile);
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

  const handleConvert = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);

      const imgUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = imgUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const doc = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });

      doc.addImage(img, 'JPEG', 0, 0, img.width, img.height);
      const pdfOutput = doc.output('blob');
      setConvertedBlob(pdfOutput);
      URL.revokeObjectURL(imgUrl);
    } catch (err: any) {
      setError(`Failed to convert JPG to PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 3, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <ImageIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            JPG to PDF Converter
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Convert JPG and PNG images to PDF in seconds.
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
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            hidden
            onChange={handleFileUpload}
          />
          <UploadFileIcon
            sx={{
              fontSize: 48,
              color: file ? 'primary.main' : 'text.secondary',
              mb: 1
            }}
          />
          <Typography variant="subtitle1" fontWeight="bold">
            {file ? file.name : 'Click to select or drop a JPG/PNG image here'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supports JPG, JPEG, PNG images
          </Typography>
        </Box>

        {file && !convertedBlob && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleConvert}
            disabled={isProcessing}
            startIcon={
              isProcessing ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
            fullWidth
          >
            {isProcessing ? 'Converting JPG to PDF...' : 'Convert Image to PDF'}
          </Button>
        )}

        {convertedBlob && (
          <Alert severity="success" sx={{ width: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Conversion Complete!
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 1 }}
            >
              Download PDF Document
            </Button>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
