import React, { useState } from 'react';
import {
  Box,
  Button,
  Popover,
  Typography,
  Stack,
  Divider,
  Paper,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import TimerIcon from '@mui/icons-material/Timer';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import { useAuth } from '../../contexts/AuthContext';

export const TokenWallet: React.FC = () => {
  const { isProUser, tokenWallet } = useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const theme = useTheme();

  // MUST NOT render anything for Free users
  if (!isProUser || !tokenWallet) {
    return null;
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const available = tokenWallet.availableTokens ?? Math.max(0, tokenWallet.dailyLimit - tokenWallet.dailyUsed) + tokenWallet.bonusTokens;

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        size="small"
        startIcon={
          <Chip
            label="PRO"
            size="small"
            color="primary"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 900,
              letterSpacing: '0.5px'
            }}
          />
        }
        endIcon={<LocalActivityIcon fontSize="small" sx={{ color: 'primary.main', opacity: 0.9 }} />}
        sx={{
          borderRadius: '100px',
          fontWeight: 700,
          textTransform: 'none',
          px: 1.75,
          py: 0.5,
          borderColor: alpha(theme.palette.primary.main, 0.4),
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          color: 'text.primary',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: alpha(theme.palette.primary.main, 0.1)
          }
        }}
      >
        <Typography variant="body2" component="span" fontWeight={800} sx={{ mr: 0.5 }}>
          {available}
        </Typography>
        <Typography variant="caption" component="span" color="text.secondary" fontWeight={600}>
          remaining
        </Typography>
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          elevation: 6,
          sx: {
            p: 2.5,
            width: 280,
            borderRadius: 4,
            mt: 1,
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <WorkspacePremiumIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={800}>
                Premium Token Balance
              </Typography>
            </Box>
            <Chip label="PRO" color="primary" size="small" sx={{ fontWeight: 800, height: 20 }} />
          </Box>

          <Divider />

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.15)
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
              AVAILABLE TODAY
            </Typography>
            <Typography variant="h4" fontWeight={900} color="primary.main">
              {available} <Typography variant="h6" component="span" color="text.secondary">/ {tokenWallet.dailyLimit}</Typography>
            </Typography>
          </Paper>

          <Stack spacing={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Used Today
              </Typography>
              <Typography variant="body2" fontWeight={800}>
                {tokenWallet.dailyUsed}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Daily Limit
              </Typography>
              <Typography variant="body2" fontWeight={800}>
                {tokenWallet.dailyLimit}
              </Typography>
            </Box>

            {tokenWallet.bonusTokens > 0 && (
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Bonus Tokens
                </Typography>
                <Typography variant="body2" fontWeight={800} color="success.main">
                  +{tokenWallet.bonusTokens}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 0.5 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={0.5}>
                <TimerIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Reset In
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                {tokenWallet.resetCountdown || '08:42:15'}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
};
