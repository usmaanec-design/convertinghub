import React from 'react';
import { Box, Button, Typography, Stack, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export interface PdfEditorHeaderProps {
  filename?: string;
  onDone: () => void;
  isSaving: boolean;
}

export default function PdfEditorHeader({
  filename = 'document.pdf',
  onDone,
  isSaving
}: PdfEditorHeaderProps) {
  return (
    <Box
      sx={{
        height: '60px',
        px: 3,
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* LEFT: Branding */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          component="img"
          src="/Logos/favicon.svg"
          alt="ConvertingHub"
          sx={{ width: 32, height: 32 }}
          onError={(e: any) => {
            e.target.style.display = 'none';
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: '18px',
            color: '#0f172a',
            letterSpacing: '-0.5px'
          }}
        >
          ConvertingHub <Typography component="span" sx={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', ml: 0.5 }}>PDF Editor</Typography>
        </Typography>
      </Stack>

      {/* CENTER: Document Filename */}
      <Box
        sx={{
          px: 2,
          py: 0.5,
          borderRadius: 2,
          bgcolor: '#f8fafc',
          border: '1px solid #e2e8f0',
          maxWidth: '350px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#334155',
            fontSize: '13.5px'
          }}
        >
          {filename}
        </Typography>
      </Box>

      {/* RIGHT: Primary Done Button */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Button
          variant="contained"
          size="medium"
          startIcon={
            isSaving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <CheckCircleIcon sx={{ fontSize: 20 }} />
            )
          }
          onClick={onDone}
          disabled={isSaving}
          sx={{
            bgcolor: '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            px: 3,
            py: 0.8,
            borderRadius: '10px',
            textTransform: 'none',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
            '&:hover': {
              bgcolor: '#1d4ed8',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
            }
          }}
        >
          {isSaving ? 'Finalizing...' : 'Done'}
        </Button>
      </Stack>
    </Box>
  );
}
