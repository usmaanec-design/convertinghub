import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  CircularProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../contexts/AuthContext';

export const FirstLaunchAuthDialog: React.FC = () => {
  const {
    showFirstLaunchDialog,
    dismissFirstLaunchDialog,
    signInWithGoogle,
    isSigningIn
  } = useAuth();

  if (!showFirstLaunchDialog) return null;

  const handleContinueWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      // Auth error handled in context
    }
  };

  return (
    <Dialog
      open={showFirstLaunchDialog}
      onClose={() => dismissFirstLaunchDialog('not_now')}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 10,
        sx: {
          borderRadius: 4,
          p: 2,
          textAlign: 'center'
        }
      }}
    >
      <Box display="flex" justifyContent="center" mt={1} mb={1}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'primary.50',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid',
            borderColor: 'primary.light'
          }}
        >
          <GoogleIcon fontSize="large" color="primary" />
        </Box>
      </Box>

      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.4rem', pt: 1, pb: 0.5 }}>
        Welcome to ConvertingHub
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sign in with Google to connect your conversion history and access all
          tools seamlessly across devices.
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{ color: 'text.secondary' }}
        >
          <SecurityIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary" fontWeight="500">
            Free, secure & privacy-first
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1.5, px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          disabled={isSigningIn}
          onClick={handleContinueWithGoogle}
          startIcon={
            isSigningIn ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <GoogleIcon />
            )
          }
          sx={{
            borderRadius: '100px',
            py: 1.2,
            fontWeight: 700,
            fontSize: '0.95rem',
            textTransform: 'none',
            boxShadow: 3
          }}
        >
          {isSigningIn ? 'Connecting...' : 'Continue with Google'}
        </Button>

        <Stack
          direction="row"
          spacing={1}
          width="100%"
          justifyContent="space-between"
        >
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            disabled={isSigningIn}
            onClick={() => dismissFirstLaunchDialog('guest')}
            sx={{
              borderRadius: '100px',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none'
            }}
          >
            Continue as Guest
          </Button>

          <Button
            fullWidth
            variant="text"
            color="inherit"
            disabled={isSigningIn}
            onClick={() => dismissFirstLaunchDialog('not_now')}
            sx={{
              borderRadius: '100px',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none'
            }}
          >
            Not now
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
