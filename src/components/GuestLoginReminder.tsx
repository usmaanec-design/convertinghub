import React from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Stack,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';

export const GuestLoginReminder: React.FC = () => {
  const {
    showLoginPrompt,
    dismissLoginPrompt,
    signInWithGoogle,
    authError,
    clearAuthError,
    isSigningIn
  } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      // Handled in context
    }
  };

  return (
    <>
      {/* Auth Error Snackbar */}
      <Snackbar
        open={Boolean(authError)}
        autoHideDuration={8000}
        onClose={clearAuthError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={clearAuthError}
          severity="warning"
          variant="filled"
          sx={{ width: '100%', fontWeight: 'bold' }}
        >
          {authError}
        </Alert>
      </Snackbar>

      {/* Guest Login Reminder Snackbar */}
      {showLoginPrompt && (
        <Snackbar
          open={showLoginPrompt}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: 2 }}
        >
          <Alert
            severity="info"
            icon={false}
            sx={{
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 6,
              border: '1px solid',
              borderColor: 'primary.light',
              p: 2,
              maxWidth: 550,
              borderRadius: 3
            }}
          >
            <Stack spacing={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <GoogleIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">
                  Connecting to ConvertingHub
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Enjoying ConvertingHub? Sign in with Google to keep your
                experience connected across devices.
              </Typography>
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="flex-end"
                pt={0.5}
              >
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  onClick={dismissLoginPrompt}
                  disabled={isSigningIn}
                  sx={{ fontWeight: 'bold' }}
                >
                  Maybe Later
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  disabled={isSigningIn}
                  startIcon={
                    isSigningIn ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <GoogleIcon />
                    )
                  }
                  onClick={handleGoogleLogin}
                  sx={{ borderRadius: '50px', fontWeight: 'bold', px: 2 }}
                >
                  {isSigningIn ? 'Connecting...' : 'Continue with Google'}
                </Button>
              </Stack>
            </Stack>
          </Alert>
        </Snackbar>
      )}
    </>
  );
};
