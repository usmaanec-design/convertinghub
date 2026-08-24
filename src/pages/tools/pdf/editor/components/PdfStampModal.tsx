import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  Stack,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface StampPreset {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface PdfStampModalProps {
  open: boolean;
  onClose: () => void;
  onSelectStamp: (stamp: StampPreset) => void;
}

const STAMP_PRESETS: StampPreset[] = [
  { label: 'APPROVED', color: '#15803d', bgColor: '#f0fdf4', borderColor: '#16a34a' },
  { label: 'REJECTED', color: '#b91c1c', bgColor: '#fef2f2', borderColor: '#dc2626' },
  { label: 'CONFIDENTIAL', color: '#c2410c', bgColor: '#fff7ed', borderColor: '#ea580c' },
  { label: 'DRAFT', color: '#475569', bgColor: '#f8fafc', borderColor: '#64748b' },
  { label: 'COPY', color: '#4338ca', bgColor: '#eef2ff', borderColor: '#4f46e5' },
  { label: 'FINAL', color: '#047857', bgColor: '#ecfdf5', borderColor: '#059669' },
  { label: 'PAID', color: '#15803d', bgColor: '#f0fdf4', borderColor: '#16a34a' },
  { label: 'RECEIVED', color: '#0369a1', bgColor: '#f0f9ff', borderColor: '#0284c7' },
  { label: 'REVIEWED', color: '#6b21a8', bgColor: '#faf5ff', borderColor: '#7e22ce' }
];

export default function PdfStampModal({
  open,
  onClose,
  onSelectStamp
}: PdfStampModalProps) {
  const [customText, setCustomText] = useState('');
  const [customColor, setCustomColor] = useState('#2563eb');

  const handleApplyCustom = () => {
    if (!customText.trim()) return;
    onSelectStamp({
      label: customText.toUpperCase(),
      color: customColor,
      bgColor: `${customColor}15`,
      borderColor: customColor
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Typography component="span" variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Select PDF Stamp
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569' }}>
          Preset Stamps
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {STAMP_PRESETS.map((preset) => (
            <Grid item xs={6} sm={4} key={preset.label}>
              <Box
                onClick={() => {
                  onSelectStamp(preset);
                  onClose();
                }}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: preset.bgColor,
                  border: `2px solid ${preset.borderColor}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    transform: 'scale(1.04)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 900,
                    color: preset.color,
                    letterSpacing: '1px',
                    fontSize: '13px'
                  }}
                >
                  {preset.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569' }}>
          Custom Stamp
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="ENTER CUSTOM STAMP TEXT..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            fullWidth
          />
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            style={{ width: 40, height: 40, border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', padding: 0 }}
          />
          <Button
            variant="contained"
            onClick={handleApplyCustom}
            disabled={!customText.trim()}
            sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}
          >
            Apply
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
