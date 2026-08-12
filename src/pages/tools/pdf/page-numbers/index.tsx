import { useState } from 'react';
import { Box, Button, Typography, Stack, Paper, Alert, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { PDFDocument, rgb } from 'pdf-lib';

export default function PageNumbers() {
  const [file, setFile] = useState<File | null>(null);
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

  const handleAddPageNumbers = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      pages.forEach((page, idx) => {
        const { width } = page.getSize();
        const pageNumText = `Page ${idx + 1} of ${totalPages}`;
        page.drawText(pageNumText, {
          x: width / 2 - 30,
          y: 20,
          size: 10,
          color: rgb(0.3, 0.3, 0.3)
        });
      });

      const pdfBytes = await pdfDoc.save();
      setConvertedBlob(new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
    } catch (err: any) {
      setError(`Failed to add page numbers: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, '')}_numbered.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 3, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <FormatListNumberedIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            Page Numbers
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Add page numbers into PDFs with ease. Automatically stamps page positions and numbering.
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

        {file && !convertedBlob && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleAddPageNumbers}
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
            fullWidth
          >
            {isProcessing ? 'Adding Page Numbers...' : 'Add Page Numbers'}
          </Button>
        )}

        {convertedBlob && (
          <Alert severity="success" sx={{ width: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Page Numbers Added Successfully!
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 1 }}
            >
              Download Numbered PDF
            </Button>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
