import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import { openMicrosoftStoreRating } from '../config/storeConfig';
import {
  hasUserRated,
  recordPromptDisplayed,
  recordUserRated
} from '../utils/conversionTracker';

let activeRatingResolver:
  | ((choice: 'rated' | 'skipped' | 'already_rated') => void)
  | null = null;

/**
 * Triggers the Rating Prompt on demand (e.g. before Download).
 * Resolves with 'already_rated', 'rated', or 'skipped'.
 */
export const triggerRatingPromptIfNeeded = (): Promise<
  'rated' | 'skipped' | 'already_rated'
> => {
  if (hasUserRated()) {
    return Promise.resolve('already_rated');
  }
  return new Promise((resolve) => {
    activeRatingResolver = resolve;
    window.dispatchEvent(new Event('showRatingPrompt'));
  });
};

export const MicrosoftStoreRatingDialog: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 1. Show rating prompt on app open if user has not rated and has not been prompted in this session
    const hasPromptedInSession = sessionStorage.getItem(
      'convertinghub_app_open_rating_prompted'
    );
    if (!hasUserRated() && !hasPromptedInSession) {
      sessionStorage.setItem('convertinghub_app_open_rating_prompted', 'true');
      recordPromptDisplayed();
      setOpen(true);
    }

    // 2. Listen for imperative rating prompt triggers (e.g. on Download click)
    const handleShowRatingPrompt = () => {
      if (!hasUserRated()) {
        recordPromptDisplayed();
        setOpen(true);
      } else {
        if (activeRatingResolver) {
          activeRatingResolver('already_rated');
          activeRatingResolver = null;
        }
      }
    };

    window.addEventListener('showRatingPrompt', handleShowRatingPrompt);
    return () => {
      window.removeEventListener('showRatingPrompt', handleShowRatingPrompt);
    };
  }, []);

  const handleRateNow = () => {
    recordUserRated();
    setOpen(false);
    openMicrosoftStoreRating();

    if (activeRatingResolver) {
      activeRatingResolver('rated');
      activeRatingResolver = null;
    }
  };

  const handleMaybeLater = () => {
    setOpen(false);
    if (activeRatingResolver) {
      activeRatingResolver('skipped');
      activeRatingResolver = null;
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (activeRatingResolver) {
      activeRatingResolver('skipped');
      activeRatingResolver = null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="store-rating-dialog-title"
      aria-describedby="store-rating-dialog-description"
      PaperProps={{
        elevation: 10,
        sx: {
          borderRadius: 4,
          p: 2.5,
          textAlign: 'center',
          position: 'relative'
        }
      }}
    >
      <IconButton
        aria-label="close"
        onClick={handleClose}
        size="small"
        sx={{
          position: 'absolute',
          right: 12,
          top: 12,
          color: 'text.secondary',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Box display="flex" justifyContent="center" mt={1} mb={1.5}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: 'amber.50',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px 0 rgba(217, 119, 6, 0.25)',
            border: '2px solid #fbf0b9'
          }}
        >
          <StarIcon sx={{ fontSize: 34, color: '#b45309' }} />
        </Box>
      </Box>

      <DialogTitle
        id="store-rating-dialog-title"
        sx={{ fontWeight: 800, fontSize: '1.4rem', pt: 1, pb: 0.5 }}
      >
        Enjoying the app?
      </DialogTitle>

      <DialogContent sx={{ pb: 2.5, px: 2 }}>
        <Typography
          id="store-rating-dialog-description"
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.6 }}
        >
          Please take a moment to rate us on the Microsoft Store. Your feedback
          helps us improve.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1.5, px: 1, pb: 1 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          onClick={handleRateNow}
          startIcon={<StarIcon />}
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
          Rate on Microsoft Store
        </Button>

        <Button
          fullWidth
          variant="text"
          color="inherit"
          onClick={handleMaybeLater}
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
