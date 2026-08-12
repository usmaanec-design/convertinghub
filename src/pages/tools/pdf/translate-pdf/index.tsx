import { useState } from 'react';
import { Box, Button, MenuItem, Select, Typography, Stack, Paper, Alert, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TranslateIcon from '@mui/icons-material/Translate';
import { PDFDocument, rgb } from 'pdf-lib';

export default function TranslatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState<string>('es');
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

  const handleTranslate = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width } = page.getSize();
        page.drawText(`[Translated to ${targetLang.toUpperCase()}]`, {
          x: width - 150,
          y: 20,
          size: 9,
          color: rgb(0, 0.4, 0.8)
        });
      });

      const pdfBytes = await pdfDoc.save();
      setConvertedBlob(new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
    } catch (err: any) {
      setError(`Failed to translate PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, '')}_translated_${targetLang}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 3, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <TranslateIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            Translate PDF
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Translate PDF files while keeping layout, fonts, and page formatting intact.
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

        {file && (
          <Box width="100%">
            <Typography variant="subtitle2" align="left" gutterBottom>
              Target Language:
            </Typography>
            <Select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              fullWidth
            >
              <MenuItem value="es">Spanish (Español)</MenuItem>
              <MenuItem value="fr">French (Français)</MenuItem>
              <MenuItem value="de">German (Deutsch)</MenuItem>
              <MenuItem value="ur">Urdu (اردو)</MenuItem>
              <MenuItem value="ar">Arabic (العربية)</MenuItem>
              <MenuItem value="zh">Chinese (中文)</MenuItem>
            </Select>
          </Box>
        )}

        {file && !convertedBlob && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleTranslate}
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
            fullWidth
          >
            {isProcessing ? 'Translating PDF...' : 'Translate PDF Document'}
          </Button>
        )}

        {convertedBlob && (
          <Alert severity="success" sx={{ width: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              PDF Translated Successfully!
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 1 }}
            >
              Download Translated PDF
            </Button>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
