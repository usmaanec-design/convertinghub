import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useAuth } from '../contexts/AuthContext';
import { EntitlementStatus } from '../utils/entitlementManager';
import { useNavigate } from 'react-router-dom';

interface EntitlementAccessModalProps {
  open: boolean;
  onClose: () => void;
  entitlement: EntitlementStatus | null;
  toolTitle?: string;
}

export const EntitlementAccessModal: React.FC<EntitlementAccessModalProps> = ({
  open,
  onClose,
  entitlement,
  toolTitle = 'PDF Conversion'
}) => {
  const { signInWithGoogle } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  if (!entitlement || entitlement.allowed) {
    return null;
  }

  const isLoginRequired = entitlement.reason === 'LOGIN_REQUIRED';
  const isProRequired = entitlement.reason === 'PRO_REQUIRED';
  const isDailyLimitReached = entitlement.reason === 'DAILY_LIMIT_REACHED';
  const isQuotaExhausted = entitlement.reason === 'GLOBAL_QUOTA_EXHAUSTED';

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (e) {
      console.error('[EntitlementModal] Google login failed:', e);
    }
  };

  const handleUpgradeToPro = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 8,
        sx: {
          borderRadius: 4,
          p: 2,
          textAlign: 'center'
        }
      }}
    >
      <Box display="flex" justifyContent="center" mt={2} mb={1}>
        {isProRequired || isDailyLimitReached ? (
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main'
            }}
          >
            <WorkspacePremiumIcon sx={{ fontSize: 36 }} />
          </Box>
        ) : (
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'secondary.main'
            }}
          >
            <LockIcon sx={{ fontSize: 34 }} />
          </Box>
        )}
      </Box>

      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.4rem', pb: 1 }}>
        {isLoginRequired && 'Free Trial Completed'}
        {isProRequired && 'Free Trial Completed'}
        {isDailyLimitReached && 'Daily Limit Reached'}
        {isQuotaExhausted && 'Monthly Limit Reached'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} alignItems="center">
          {isLoginRequired && (
            <>
              <Typography variant="body1" color="text.secondary">
                You have used your <strong>3 free conversions</strong> for today.
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  width: '100%',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: 3
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                  Sign in with Google to unlock 1 additional free conversion.
                </Typography>
              </Paper>
            </>
          )}

          {isProRequired && (
            <>
              <Typography variant="body1" color="text.secondary">
                You have used your free trial conversions.
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  width: '100%',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: 3
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                  Upgrade to Pro to continue converting PDF files to Word and Excel.
                </Typography>
              </Paper>
            </>
          )}

          {isDailyLimitReached && (
            <Typography variant="body1" color="text.secondary">
              You have used all 10 of your daily Pro tokens for today. Your daily limit will reset tomorrow at midnight.
            </Typography>
          )}

          {isQuotaExhausted && (
            <Typography variant="body1" color="text.secondary">
              Premium conversion capacity for this month has been reached. Please try again when the monthly quota resets.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1.5, px: 3, pb: 2 }}>
        {isLoginRequired && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{ py: 1.25, fontWeight: 800, borderRadius: 2.5, textTransform: 'none' }}
          >
            Continue with Google
          </Button>
        )}

        {isProRequired && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={<WorkspacePremiumIcon />}
            onClick={handleUpgradeToPro}
            sx={{ py: 1.25, fontWeight: 800, borderRadius: 2.5, textTransform: 'none' }}
          >
            Upgrade to Pro
          </Button>
        )}

        <Button
          variant="text"
          color="inherit"
          onClick={onClose}
          sx={{ fontWeight: 700, textTransform: 'none', color: 'text.secondary' }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
