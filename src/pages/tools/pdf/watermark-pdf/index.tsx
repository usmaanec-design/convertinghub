import { useState } from 'react';
import { Box, Button, TextField, Typography, Stack, Paper, Alert, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { PDFDocument, rgb, degrees } from 'pdf-lib';

export default function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
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

  const handleApplyWatermark = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText || 'WATERMARK', {
          x: width / 4,
          y: height / 2,
          size: 45,
          color: rgb(0.75, 0.75, 0.75),
          rotate: degrees(45),
          opacity: 0.4
        });
      });

      const pdfBytes = await pdfDoc.save();
      setConvertedBlob(new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
    } catch (err: any) {
      setError(`Failed to apply watermark: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, '')}_watermarked.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 3, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <WaterDropIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            Watermark PDF
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Stamp text watermarks over your PDF pages with custom transparency and rotation.
        </Typography>

        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

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
          <UploadFileIcon sx={{ fontSize: 48, color: file ? 'primary.main' : 'text.secondary', mb: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            {file ? file.name : 'Click to select or drop a PDF file here'}
          </Typography>
        </Box>

        <TextField
          label="Watermark Text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          fullWidth
        />

        {file && !convertedBlob && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleApplyWatermark}
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
            fullWidth
          >
            {isProcessing ? 'Applying Watermark...' : 'Apply Watermark'}
          </Button>
        )}

        {convertedBlob && (
          <Alert severity="success" sx={{ width: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Watermark Applied Successfully!
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 1 }}
            >
              Download Watermarked PDF
            </Button>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
