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
import TableChartIcon from '@mui/icons-material/TableChart';
import { libreOfficeEngine, ConversionResult } from '@utils/libreofficeEngine';
import { EngineResultBanner } from '../../../../components/EngineResultBanner';
import { ConversionProgressBar } from '../../../../components/ConversionProgressBar';

import { useAuth } from '../../../../contexts/AuthContext';
import { executeProtectedDownload } from '../../../../utils/downloadInterceptor';
import { usePendingConversionFile } from '../../../../hooks';

export default function ExcelToPdf() {
  const [file, setFile] = useState<File | null>(null);
  usePendingConversionFile(file, setFile);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, signInWithGoogle } = useAuth();

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
      const res = await libreOfficeEngine.convertDocument(file, 'pdf');
      if (!res.success || !res.blob) {
        setError(
          res.error ||
            'Document conversion service is temporarily unavailable. Please try again.'
        );
        setResult(null);
      } else {
        setResult(res);
      }
    } catch (err: any) {
      setError(`Failed to convert Excel to PDF: ${err.message}`);
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !result.blob || !file) return;
    const blob = result.blob;
    executeProtectedDownload(
      () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
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
          <TableChartIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            Excel to PDF Converter
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Make EXCEL spreadsheets easy to read by converting them to PDF
          documents cleanly and quickly.
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
            accept=".xls,.xlsx,.csv"
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
            {file ? file.name : 'Click to select or drop an Excel file here'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supports XLS, XLSX, CSV files
          </Typography>
        </Box>

        {file && !result && (
          <Stack spacing={2} width="100%">
            {isProcessing && (
              <ConversionProgressBar
                isProcessing={true}
                title="Converting Excel to PDF..."
              />
            )}
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleConvert}
              disabled={isProcessing}
              fullWidth
            >
              {isProcessing ? 'Converting Excel to PDF...' : 'Convert to PDF'}
            </Button>
          </Stack>
        )}

        {result && (
          <Stack spacing={2} width="100%">
            <EngineResultBanner
              engineUsed={result.engineUsed}
              filename={result.filename}
            />
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download PDF Document
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
