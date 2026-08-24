import React from 'react';
import { Paper, Typography, Button, Stack, Chip, Box } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import { Link } from 'react-router-dom';

interface ProFeatureBannerProps {
  featureName: string;
}

export const ProFeatureBanner: React.FC<ProFeatureBannerProps> = ({
  featureName
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 3, sm: 4 },
        maxWidth: 700,
        mx: 'auto',
        mt: 2,
        borderRadius: 4,
        border: '2px solid',
        borderColor: 'primary.main',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(156,39,176,0.05) 100%)'
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(25,118,210,0.3)'
          }}
        >
          <LockIcon sx={{ fontSize: 32 }} />
        </Box>

        <Chip
          icon={<StarIcon sx={{ fontSize: '0.9rem !important' }} />}
          label="Pro Plan Required"
          color="primary"
          sx={{ fontWeight: 700, px: 1 }}
        />

        <Typography variant="h5" fontWeight={800}>
          {featureName} Requires Pro Plan
        </Typography>

        <Typography color="text.secondary" sx={{ maxWidth: 520, fontSize: '0.95rem' }}>
          <strong>{featureName}</strong> is an advanced conversion tool exclusive to ConvertingHub Pro & Business subscribers. All other standard conversion tools remain 100% free and unlimited.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <Button
            component={Link}
            to="/pricing"
            variant="contained"
            color="primary"
            size="large"
            startIcon={<StarIcon />}
            sx={{
              py: 1.25,
              px: 4,
              borderRadius: 100,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Upgrade to Pro
          </Button>
          <Button
            component={Link}
            to="/"
            variant="outlined"
            color="inherit"
            size="large"
            sx={{ py: 1.25, px: 3, borderRadius: 100, fontWeight: 700, textTransform: 'none' }}
          >
            Explore Free Tools
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
