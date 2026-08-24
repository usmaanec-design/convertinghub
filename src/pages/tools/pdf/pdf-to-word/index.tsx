import { useState, useEffect } from 'react';
import { Box, Button, Typography, Stack, Paper, Alert, Chip, alpha, useTheme } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { convertPdfToWord } from './service';
import { EngineResultBanner } from '../../../../components/EngineResultBanner';
import { ConversionProgressBar } from '../../../../components/ConversionProgressBar';
import { PdfUploadPreview } from '../../../../components/PdfUploadPreview';
import { ConversionResult } from '@utils/libreofficeEngine';

import { useAuth } from '../../../../contexts/AuthContext';
import { executeProtectedDownload } from '../../../../utils/downloadInterceptor';
import { fetchEntitlementStatus, EntitlementStatus } from '../../../../utils/entitlementManager';
import { EntitlementAccessModal } from '../../../../components/EntitlementAccessModal';
import { usePendingConversionFile } from '../../../../hooks';

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  usePendingConversionFile(file, setFile);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const { user, isAuthenticated, isProUser, signInWithGoogle, tokenWallet, refreshTokens } = useAuth();
  const theme = useTheme();

  const loadEntitlement = async () => {
    const status = await fetchEntitlementStatus('pdf-to-word', user?.uid);
    setEntitlement(status);
  };

  useEffect(() => {
    loadEntitlement();
  }, [user?.uid, isProUser]);

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

    // Pre-flight entitlement check
    const status = await fetchEntitlementStatus('pdf-to-word', user?.uid);
    setEntitlement(status);

    if (!status.allowed) {
      setModalOpen(true);
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const userId = user ? user.uid : undefined;
      const res = await convertPdfToWord(file, { userId, authToken: userId });

      if (!res.success || !res.blob) {
        if (res.error?.includes('Sign in') || res.error?.includes('3 free')) {
          setEntitlement({ allowed: false, reason: 'LOGIN_REQUIRED', message: res.error });
          setModalOpen(true);
        } else if (res.error?.includes('Upgrade to Pro') || res.error?.includes('completed')) {
          setEntitlement({ allowed: false, reason: 'PRO_REQUIRED', message: res.error });
          setModalOpen(true);
        } else {
          setError(
            res.error ||
              'Document conversion service is temporarily unavailable. Your trial count was not deducted.'
          );
        }
        setResult(null);
      } else {
        setResult(res);
        if (isProUser) {
          await refreshTokens();
        }
        await loadEntitlement();
      }
    } catch (err: any) {
      setError(`Conversion failed. Your trial count was not deducted: ${err.message}`);
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

  const availableTokens = tokenWallet ? tokenWallet.availableTokens : 10;

  return (
    <Paper sx={{ p: 3, maxWidth: 750, mx: 'auto', mt: 1, textAlign: 'center', position: 'relative' }}>
      {/* Top Banner / Indicator */}
      {isProUser ? (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={1}
          mb={2}
          sx={{
            py: 0.75,
            px: 2,
            borderRadius: '100px',
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.2),
            width: 'fit-content',
            mx: 'auto'
          }}
        >
          <Chip label="PRO" size="small" color="primary" sx={{ fontWeight: 900, height: 18, fontSize: '0.65rem' }} />
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            {availableTokens} tokens remaining today
          </Typography>
        </Box>
      ) : entitlement?.accessType === 'anonymous_trial' ? (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={1}
          mb={2}
          sx={{
            py: 0.75,
            px: 2,
            borderRadius: '100px',
            bgcolor: alpha(theme.palette.info.main, 0.06),
            border: '1px solid',
            borderColor: alpha(theme.palette.info.main, 0.2),
            width: 'fit-content',
            mx: 'auto'
          }}
        >
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            Free conversions remaining: {entitlement.remainingTrial ?? 3} / 3
          </Typography>
        </Box>
      ) : entitlement?.accessType === 'authenticated_bonus' ? (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={1}
          mb={2}
          sx={{
            py: 0.75,
            px: 2,
            borderRadius: '100px',
            bgcolor: alpha(theme.palette.success.main, 0.08),
            border: '1px solid',
            borderColor: alpha(theme.palette.success.main, 0.25),
            width: 'fit-content',
            mx: 'auto'
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
          <Typography variant="caption" fontWeight={700} color="success.dark">
            You're signed in. You have 1 additional free conversion.
          </Typography>
        </Box>
      ) : null}

      <Stack spacing={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <DescriptionIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight="bold">
            PDF to Word Converter
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Convert PDF documents into editable Microsoft Word (.docx) documents
          cleanly and quickly.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', borderRadius: 2 }}>
            {error}
          </Alert>
        )}

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
            <input
              type="file"
              accept=".pdf"
              hidden
              onChange={handleFileUpload}
            />
            <UploadFileIcon
              sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
            />
            <Typography variant="subtitle1" fontWeight="bold">
              Click to select or drop a PDF file here
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supports all standard PDF documents (.pdf)
            </Typography>
          </Box>
        ) : (
          <PdfUploadPreview
            file={file}
            onRemove={() => {
              setFile(null);
              setResult(null);
            }}
          />
        )}

        <ConversionProgressBar
          isProcessing={isProcessing}
          title="Converting PDF to Word document..."
        />

        {file && !result && !isProcessing && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleConvert}
            fullWidth
            sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }}
          >
            Convert to Word Document (.docx)
          </Button>
        )}

        {result && (
          <Stack spacing={2} width="100%">
            <EngineResultBanner
              engineUsed={result.engineUsed}
              filename={result.filename}
              durationMs={result.durationMs}
            />
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

      {/* Entitlement Access Modal */}
      <EntitlementAccessModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        entitlement={entitlement}
        toolTitle="PDF to Word"
      />
    </Paper>
  );
}
