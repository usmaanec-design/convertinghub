import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Stack
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../contexts/AuthContext';

let activeAuthResolver: ((success: boolean) => void) | null = null;

/**
 * Imperatively requests Google Login with a modal prompt when authentication is required for download.
 * Resolves to true if login succeeds, or false if cancelled / closed.
 */
export const requestGoogleLoginWithModal = (): Promise<boolean> => {
  return new Promise((resolve) => {
    activeAuthResolver = resolve;
    window.dispatchEvent(new Event('showDownloadAuthModal'));
  });
};

export const DownloadAuthModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { signInWithGoogle, isSigningIn, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleShow = () => {
      if (!isAuthenticated) {
        setOpen(true);
      } else {
        if (activeAuthResolver) {
          activeAuthResolver(true);
          activeAuthResolver = null;
        }
      }
    };

    window.addEventListener('showDownloadAuthModal', handleShow);
    return () => {
      window.removeEventListener('showDownloadAuthModal', handleShow);
    };
  }, [isAuthenticated]);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    try {
      await signInWithGoogle();
      setOpen(false);
      if (activeAuthResolver) {
        activeAuthResolver(true);
        activeAuthResolver = null;
      }
    } catch (err) {
      console.warn('[DownloadAuthModal] Sign in cancelled or failed:', err);
    }
  };

  const handleClose = () => {
    if (isSigningIn) return;
    setOpen(false);
    if (activeAuthResolver) {
      activeAuthResolver(false);
      activeAuthResolver = null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="login-required-dialog-title"
      aria-describedby="login-required-dialog-description"
      PaperProps={{
        elevation: 10,
        sx: {
          borderRadius: 4,
          p: 2.5,
          textAlign: 'center'
        }
      }}
    >
      <Box display="flex" justifyContent="center" mt={1} mb={1.5}>
        <Box
          sx={{
            width: 60,
            height: 60,
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
          <LockOutlinedIcon fontSize="large" color="primary" />
        </Box>
      </Box>

      <DialogTitle
        id="login-required-dialog-title"
        sx={{ fontWeight: 800, fontSize: '1.4rem', pt: 1, pb: 0.5 }}
      >
        Login Required
      </DialogTitle>

      <DialogContent sx={{ pb: 2, px: 2 }}>
        <Typography
          id="login-required-dialog-description"
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.6, mb: 2 }}
        >
          Please sign in with Google to continue downloading your files.
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{
            bgcolor: 'action.hover',
            py: 1,
            px: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <SecurityIcon fontSize="small" color="primary" />
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight="600"
          >
            ConvertingHub is free to use. Sign in is free and only takes a moment.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1.5, px: 1, pb: 1 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          disabled={isSigningIn}
          onClick={handleSignIn}
          startIcon={
            isSigningIn ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <GoogleIcon />
            )
          }
          sx={{
            borderRadius: '100px',
            py: 1.3,
            fontWeight: 700,
            fontSize: '0.95rem',
            textTransform: 'none',
            boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.35)',
            '&:hover': {
              boxShadow: '0 6px 20px 0 rgba(37, 99, 235, 0.45)'
            }
          }}
        >
          {isSigningIn ? 'Signing in…' : 'Continue with Google'}
        </Button>

        <Button
          fullWidth
          variant="text"
          color="inherit"
          disabled={isSigningIn}
          onClick={handleClose}
          sx={{
            borderRadius: '100px',
            py: 0.8,
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'none',
            color: 'text.secondary'
          }}
        >
          Maybe Later
        </Button>
      </DialogActions>
    </Dialog>
  );
};
