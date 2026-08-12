import React, { useEffect, useState } from 'react';
import { Box, LinearProgress, Typography, Paper, Stack } from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';

interface ConversionProgressBarProps {
  isProcessing: boolean;
  title?: string;
}

export const ConversionProgressBar: React.FC<ConversionProgressBarProps> = ({
  isProcessing,
  title = 'Converting document with LibreOffice Engine...'
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [stageText, setStageText] = useState<string>('Initializing conversion engine...');

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setProgress(5);
      setStageText('Uploading document to LibreOffice engine...');

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) {
            setStageText('Parsing document pages & vector layers...');
            return prev + 5;
          } else if (prev < 70) {
            setStageText('Processing layout, fonts, and graphics with LibreOffice Headless...');
            return prev + 3;
          } else if (prev < 92) {
            setStageText('Generating final presentation & layout structure...');
            return prev + 1;
          }
          return 95; // Hold at 95% until complete
        });
      }, 400);
    } else {
      setProgress(100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        width: '100%',
        bgcolor: 'action.hover',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'primary.light'
      }}
    >
      <Stack spacing={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <MemoryIcon color="primary" sx={{ animation: 'spin 2s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
            <Typography variant="subtitle2" fontWeight="bold">
              {title}
            </Typography>
          </Box>
          <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
            {Math.round(progress)}%
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              transition: 'transform 0.3s ease-in-out'
            }
          }}
        />

        <Typography variant="caption" color="text.secondary" align="center">
          {stageText}
        </Typography>
      </Stack>
    </Paper>
  );
};
