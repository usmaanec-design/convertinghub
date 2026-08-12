import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Alert,
  Grid,
  Card,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { convertPdfToExcel, PdfToExcelOptions } from './service';
import { EngineResultBanner } from '../../../../components/EngineResultBanner';
import { ConversionProgressBar } from '../../../../components/ConversionProgressBar';
import { PdfUploadPreview } from '../../../../components/PdfUploadPreview';
import { ConversionResult } from '@utils/libreofficeEngine';

export default function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [useOcr, setUseOcr] = useState<boolean>(false);
  const [layout, setLayout] = useState<'single' | 'multiple'>('single'); // Single Sheet is Default!
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
      const options: PdfToExcelOptions = { layout, useOcr };
      const res = await convertPdfToExcel(file, options);
      if (!res.success || !res.blob) {
        setError(res.error || 'Document conversion service is temporarily unavailable. Please try again.');
        setResult(null);
      } else {
        setResult(res);
      }
    } catch (err: any) {
      setError(`Failed to convert PDF to Excel: ${err.message}`);
      setResult(null);
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
    <Box sx={{ p: 1, maxWidth: 1100, mx: 'auto', mt: 0.5 }}>
      <Grid container spacing={3}>
        {/* Left Main Content / File Upload & Preview */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {!file ? (
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 3,
                  p: 6,
                  width: '100%',
                  textAlign: 'center',
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                  transition: '0.2s hover',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.selected' }
                }}
                component="label"
              >
                <input type="file" accept=".pdf" hidden onChange={handleFileUpload} />
                <TableChartIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Select PDF File
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click or drag PDF file here to convert to Excel spreadsheet
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3} alignItems="center" width="100%">
                {/* Lightweight First-Page Preview */}
                <PdfUploadPreview file={file} onRemove={() => { setFile(null); setResult(null); }} />

                <ConversionProgressBar isProcessing={isProcessing} title="Extracting PDF to Excel spreadsheets..." />

                {result && (
                  <Stack spacing={2} width="100%">
                    <EngineResultBanner engineUsed={result.engineUsed} filename={result.filename} durationMs={result.durationMs} />
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownload}
                      fullWidth
                    >
                      Download EXCEL (.xlsx)
                    </Button>
                  </Stack>
                )}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right Options Sidebar */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
                PDF to Excel Options
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {/* Output Sheet Mode Selection */}
              <Box my={2}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
                    Output Sheet Mode
                  </FormLabel>
                  <RadioGroup
                    value={layout}
                    onChange={(e) => setLayout(e.target.value as 'single' | 'multiple')}
                  >
                    <Card
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        border: '2px solid',
                        borderColor: layout === 'single' ? 'primary.main' : 'divider',
                        bgcolor: layout === 'single' ? 'action.selected' : 'background.paper',
                        cursor: 'pointer'
                      }}
                      onClick={() => setLayout('single')}
                    >
                      <FormControlLabel
                        value="single"
                        control={<Radio size="small" color="primary" />}
                        label={
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              Single Sheet (Default)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              All PDF pages are merged into ONE Excel worksheet sequentially.
                            </Typography>
                          </Box>
                        }
                      />
                    </Card>

                    <Card
                      sx={{
                        p: 1.5,
                        border: '2px solid',
                        borderColor: layout === 'multiple' ? 'primary.main' : 'divider',
                        bgcolor: layout === 'multiple' ? 'action.selected' : 'background.paper',
                        cursor: 'pointer'
                      }}
                      onClick={() => setLayout('multiple')}
                    >
                      <FormControlLabel
                        value="multiple"
                        control={<Radio size="small" color="primary" />}
                        label={
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              Multiple Sheets
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Each PDF page gets its own separate worksheet (Page 1, Page 2...).
                            </Typography>
                          </Box>
                        }
                      />
                    </Card>
                  </RadioGroup>
                </FormControl>
              </Box>
            </Box>

            {/* Convert Button */}
            <Box mt={3}>
              <Button
                variant="contained"
                onClick={handleConvert}
                disabled={!file || isProcessing}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: 'primary.main',
                  py: 1.5,
                  fontSize: 16,
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none'
                }}
                fullWidth
              >
                {isProcessing ? 'Converting PDF to Excel...' : 'Convert to EXCEL (.xlsx)'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
