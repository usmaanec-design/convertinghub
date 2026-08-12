import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import { convertPdfToWord } from './service';
import { EngineResultBanner } from '../../../../components/EngineResultBanner';
import { ConversionProgressBar } from '../../../../components/ConversionProgressBar';
import { PdfUploadPreview } from '../../../../components/PdfUploadPreview';
import { ConversionResult } from '@utils/libreofficeEngine';

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
      setFile(uploaded);
      setResult(null);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);
      const res = await convertPdfToWord(file);
      setResult(res);
    } catch (err: any) {
      setError(`Failed to convert PDF to Word: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !result.blob || !file) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 750, mx: 'auto', mt: 1, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <DescriptionIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            PDF to Word Converter
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Convert PDF documents into editable Microsoft Word (.docx) documents cleanly and quickly.
        </Typography>

        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

        {!file ? (
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              width: '100%',
              bgcolor: 'action.hover',
              cursor: 'pointer'
            }}
            component="label"
          >
            <input type="file" accept=".pdf" hidden onChange={handleFileUpload} />
            <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Click to select or drop a PDF file here
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supports all standard PDF documents (.pdf)
            </Typography>
          </Box>
        ) : (
          <PdfUploadPreview file={file} onRemove={() => { setFile(null); setResult(null); }} />
        )}

        <ConversionProgressBar isProcessing={isProcessing} title="Converting PDF to Word document..." />

        {file && !result && !isProcessing && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleConvert}
            fullWidth
          >
            Convert to Word Document (.docx)
          </Button>
        )}

        {result && (
          <Stack spacing={2} width="100%">
            <EngineResultBanner engineUsed={result.engineUsed} filename={result.filename} durationMs={result.durationMs} />
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download Word Document (.docx)
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
