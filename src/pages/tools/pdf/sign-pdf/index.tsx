import { useState, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import { PDFDocument, rgb } from 'pdf-lib';
import { usePendingConversionFile } from '../../../../hooks';

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  usePendingConversionFile(file, setFile);
  const [signerName, setSignerName] = useState<string>('John Doe');
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

  const handleSign = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];

      const dateStr = new Date().toLocaleDateString();
      lastPage.drawText(
        `Signed by: ${signerName || 'Signature'}\nDate: ${dateStr}`,
        {
          x: 50,
          y: 60,
          size: 12,
          color: rgb(0, 0.2, 0.6)
        }
      );

      const pdfBytes = await pdfDoc.save();
      setConvertedBlob(
        new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      );
    } catch (err: any) {
      setError(`Failed to sign PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, '')}_signed.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 3, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <EditIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            Sign PDF
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Sign yourself or add electronic signatures & digital stamps to your
          PDF documents.
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
          <TextField
            label="Signer Name / Text Signature"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            fullWidth
          />
        )}

        {file && !convertedBlob && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSign}
            disabled={isProcessing}
            startIcon={
              isProcessing ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
            fullWidth
          >
            {isProcessing ? 'Signing PDF...' : 'Sign Document'}
          </Button>
        )}

        {convertedBlob && (
          <Alert severity="success" sx={{ width: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              PDF Signed Successfully!
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 1 }}
            >
              Download Signed PDF
            </Button>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
