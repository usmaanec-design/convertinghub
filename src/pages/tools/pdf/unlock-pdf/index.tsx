import { useState } from 'react';
import { Box, Button, TextField, Typography, Stack, Paper, Alert, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { PDFDocument } from 'pdf-lib';

export default function UnlockPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
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

  const handleUnlock = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pdfBytes = await pdfDoc.save();
      setConvertedBlob(new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
    } catch (err: any) {
      setError(`Failed to unlock PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, '')}_unlocked.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 3, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <LockOpenIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            Unlock PDF
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Remove PDF password security and restriction permissions.
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
            {file ? file.name : 'Click to select or drop a locked PDF file here'}
          </Typography>
        </Box>

        {file && (
          <TextField
            label="Password (if required)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
        )}

        {file && !convertedBlob && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleUnlock}
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
            fullWidth
          >
            {isProcessing ? 'Unlocking PDF...' : 'Unlock PDF Document'}
          </Button>
        )}

        {convertedBlob && (
          <Alert severity="success" sx={{ width: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              PDF Unlocked Successfully!
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 1 }}
            >
              Download Unlocked PDF
            </Button>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
