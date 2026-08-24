import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Stack,
  Tooltip,
  Divider
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import PanToolIcon from '@mui/icons-material/PanTool';

import { EditorToolMode } from '../pdfEditorTypes';

export interface PdfEditorFloatingNavProps {
  currentPage: number; // 1-based
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  toolMode: EditorToolMode;
  onSetToolMode: (mode: EditorToolMode) => void;
}

export default function PdfEditorFloatingNav({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  toolMode,
  onSetToolMode
}: PdfEditorFloatingNavProps) {
  const isHandMode = toolMode === 'hand';

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #cbd5e1',
        borderRadius: '30px',
        px: 2,
        py: 0.75,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      {/* PAGE NAVIGATION */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="Previous Page">
          <span>
            <IconButton
              size="small"
              onClick={onPrevPage}
              disabled={currentPage <= 1}
              sx={{ color: '#475569', p: 0.5 }}
            >
              <NavigateBeforeIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: '#1e293b',
            fontSize: '12.5px',
            minWidth: 70,
            textAlign: 'center'
          }}
        >
          {currentPage} / {totalPages || 1}
        </Typography>

        <Tooltip title="Next Page">
          <span>
            <IconButton
              size="small"
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
              sx={{ color: '#475569', p: 0.5 }}
            >
              <NavigateNextIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ my: 0.5, borderColor: '#cbd5e1' }} />

      {/* ZOOM CONTROLS */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="Zoom Out">
          <IconButton size="small" onClick={onZoomOut} sx={{ color: '#475569', p: 0.5 }}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: '#1e293b',
            fontSize: '12px',
            minWidth: 45,
            textAlign: 'center'
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </Typography>

        <Tooltip title="Zoom In">
          <IconButton size="small" onClick={onZoomIn} sx={{ color: '#475569', p: 0.5 }}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ my: 0.5, borderColor: '#cbd5e1' }} />

      {/* VIEWPORT & HAND TOOL */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="Fit to Width">
          <IconButton size="small" onClick={onFitWidth} sx={{ color: '#475569', p: 0.5 }}>
            <AspectRatioIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Fit Page">
          <IconButton size="small" onClick={onFitPage} sx={{ color: '#475569', p: 0.5 }}>
            <FitScreenIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Hand / Pan Tool">
          <IconButton
            size="small"
            onClick={() => onSetToolMode(isHandMode ? 'select' : 'hand')}
            sx={{
              p: 0.5,
              bgcolor: isHandMode ? '#eff6ff' : 'transparent',
              color: isHandMode ? '#2563eb' : '#475569'
            }}
          >
            <PanToolIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
