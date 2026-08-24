import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

import { summarizeDocument } from '../../../../utils/aiService';
import { usePendingConversionFile } from '../../../../hooks';

export default function PdfAiSummarizer() {
  const [file, setFile] = useState<File | null>(null);
  usePendingConversionFile(file, setFile);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [summary, setSummary] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
      setFile(uploaded);
      setSummary([]);
      setError(null);
    }
  };

  const handleSummarize = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      for (let i = 1; i <= Math.min(10, pdfDoc.numPages); i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        fullText +=
          textContent.items.map((item: any) => item.str).join(' ') + ' ';
      }

      const words = fullText.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);

      if (!fullText.trim()) {
        throw new Error('No readable text extracted from the uploaded PDF document.');
      }

      // Call GenAI Summarization Service
      const keyPoints = await summarizeDocument(fullText);
      setSummary(keyPoints);
    } catch (err: any) {
      setError(`Failed to summarize PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 3, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesomeIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            AI PDF Summarizer
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Quickly generate concise summaries, bullet points, and key insights
          from PDF documents in seconds.
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

        {file && summary.length === 0 && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSummarize}
            disabled={isProcessing}
            startIcon={
              isProcessing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AutoAwesomeIcon />
              )
            }
            fullWidth
          >
            {isProcessing ? 'Generating AI Summary...' : 'Generate AI Summary'}
          </Button>
        )}

        {summary.length > 0 && (
          <Card
            sx={{
              width: '100%',
              textAlign: 'left',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                color="primary.main"
                fontWeight="bold"
                gutterBottom
                display="flex"
                alignItems="center"
                gap={1}
              >
                <AutoAwesomeIcon /> Executive Summary ({wordCount} words
                analyzed)
              </Typography>
              <Stack spacing={1} mt={2}>
                {summary.map((point, i) => (
                  <Typography
                    key={i}
                    variant="body2"
                    sx={{
                      pl: 2,
                      borderLeft: '3px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    • {point}.
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Paper>
  );
}
