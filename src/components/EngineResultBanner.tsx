import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface EngineResultBannerProps {
  filename?: string;
  durationMs?: number;
}

export const EngineResultBanner: React.FC<EngineResultBannerProps> = ({ filename, durationMs }) => {
  return (
    <Alert
      severity="success"
      icon={<CheckCircleIcon fontSize="inherit" />}
      sx={{ width: '100%', mb: 2 }}
    >
      <Box textAlign="left">
        <Typography variant="subtitle2" fontWeight="bold">
          Conversion complete! {filename ? `(${filename})` : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Your document is ready. {durationMs ? `(${(durationMs / 1000).toFixed(1)}s)` : ''}
        </Typography>
      </Box>
    </Alert>
  );
};
