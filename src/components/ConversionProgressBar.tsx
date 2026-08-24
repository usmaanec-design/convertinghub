import React, { useEffect, useState } from 'react';
import { Box, LinearProgress, Typography, Paper, Stack } from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';

interface ConversionProgressBarProps {
  isProcessing?: boolean;
  title?: string;
  stageTextOverride?: string;
}

export const ConversionProgressBar: React.FC<ConversionProgressBarProps> = ({
  isProcessing = true,
  title = 'Processing file...',
  stageTextOverride
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [stageText, setStageText] = useState<string>(
    stageTextOverride || 'Preparing conversion...'
  );

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setProgress(5);
      setStageText(stageTextOverride || 'Uploading and reading file structure...');

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) {
            setStageText(stageTextOverride || 'Analyzing format and structure...');
            return prev + 6;
          } else if (prev < 70) {
            setStageText(stageTextOverride || 'Processing conversion & encoding content...');
            return prev + 4;
          } else if (prev < 94) {
            setStageText(stageTextOverride || 'Finalizing output file...');
            return prev + 2;
          }
          return 95;
        });
      }, 300);
    } else {
      setProgress(100);
      setStageText('Conversion completed!');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, stageTextOverride]);

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
            <MemoryIcon
              color="primary"
              sx={{
                animation: 'spin 1.5s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
            <Typography variant="subtitle2" fontWeight="bold">
              {title}
            </Typography>
          </Box>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color="primary.main"
          >
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
              transition: 'transform 0.25s ease-in-out'
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
