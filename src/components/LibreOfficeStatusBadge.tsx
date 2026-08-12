import React, { useState } from 'react';
import {
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TerminalIcon from '@mui/icons-material/Terminal';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useLibreOffice } from '../context/LibreOfficeContext';

export const LibreOfficeStatusBadge: React.FC = () => {
  const { status, refreshStatus, testEngine, isChecking } = useLibreOffice();
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleOpen = () => {
    setTestResult(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testEngine();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  let color: 'success' | 'warning' | 'error' = 'error';
  let label = 'Engine Offline';
  let icon = <ErrorOutlineIcon fontSize="small" />;

  if (status.status === 'connected') {
    color = 'success';
    label = 'Conversion Engine Ready';
    icon = <CheckCircleIcon fontSize="small" />;
  } else if (status.status === 'not_installed') {
    color = 'error';
    label = 'Conversion Engine Pending';
    icon = <ErrorOutlineIcon fontSize="small" />;
  } else if (status.status === 'bridge_down') {
    color = 'warning';
    label = 'Engine Bridge Offline';
    icon = <WarningIcon fontSize="small" />;
  }

  return (
    <>
      <Tooltip title="Click to view Conversion Engine Status & Settings">
        <Chip
          icon={icon}
          label={isChecking ? 'Checking Engine...' : label}
          color={color}
          variant="outlined"
          onClick={handleOpen}
          sx={{
            fontWeight: 'bold',
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { opacity: 0.9 }
          }}
        />
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerminalIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Document Conversion Engine Status
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {status.status === 'connected' ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <Typography variant="subtitle2" fontWeight="bold">
                  High-Speed Document Conversion Engine Active
                </Typography>
                High-fidelity document processing (PDF ↔ Word/Excel/PPTX) is active and running.
              </Alert>
            ) : status.status === 'not_installed' ? (
              <Alert severity="error">
                <Typography variant="subtitle2" fontWeight="bold">
                  Conversion Engine Pending
                </Typography>
                The backend document processing engine is initializing.
              </Alert>
            ) : (
              <Alert severity="warning">
                <Typography variant="subtitle2" fontWeight="bold">
                  Conversion Engine Offline
                </Typography>
                The document processing server is currently offline.
              </Alert>
            )}

            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ENGINE METRICS & DETAILS
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Typography variant="body2" fontWeight="bold" color={`${color}.main`}>
                    {status.status.toUpperCase()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Mode:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    High-Fidelity Headless Pipeline
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'}>
                {testResult.message}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => refreshStatus()}
            disabled={isChecking}
          >
            Re-check Engine
          </Button>
          <Box display="flex" gap={1}>
            {status.status === 'connected' && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={testing ? <CircularProgress size={18} /> : <PlayArrowIcon />}
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? 'Testing Engine...' : 'Test Engine Pipeline'}
              </Button>
            )}
            <Button onClick={handleClose} variant="contained">
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};
