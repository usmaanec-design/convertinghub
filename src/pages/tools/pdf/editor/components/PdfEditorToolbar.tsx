import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Divider,
  Typography,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import MouseIcon from '@mui/icons-material/Mouse';
import TitleIcon from '@mui/icons-material/Title';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import CreateIcon from '@mui/icons-material/Create';
import HighlightIcon from '@mui/icons-material/Highlight';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ImageIcon from '@mui/icons-material/Image';
import GestureIcon from '@mui/icons-material/Gesture';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import AddPageIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import ShapeLineIcon from '@mui/icons-material/Category';

import { EditorToolMode } from '../pdfEditorTypes';

export interface PdfEditorToolbarProps {
  toolMode: EditorToolMode;
  onSetToolMode: (mode: EditorToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onAddBlankPage: () => void;
  onDeleteCurrentPage: () => void;
  onRotateCurrentPage: () => void;
  onDuplicateCurrentPage: () => void;
  onImageUploadClick: () => void;
  onSignatureModalOpen: () => void;
  onAiModalOpen: () => void;
  onSaveAndExport: () => void;
  isSaving: boolean;
  hasResult: boolean;
  onDownloadResult: () => void;
}

export default function PdfEditorToolbar({
  toolMode,
  onSetToolMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onAddBlankPage,
  onDeleteCurrentPage,
  onRotateCurrentPage,
  onDuplicateCurrentPage,
  onImageUploadClick,
  onSignatureModalOpen,
  onAiModalOpen,
  onSaveAndExport,
  isSaving,
  hasResult,
  onDownloadResult
}: PdfEditorToolbarProps) {
  // Shape menu state
  const [shapeAnchorEl, setShapeAnchorEl] = React.useState<null | HTMLElement>(null);

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: '#1e293b',
        color: '#fff',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        boxShadow: 3
      }}
    >
      {/* 1. History & Tools Selector Group */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        {/* Undo / Redo */}
        <Tooltip title="Undo (Ctrl+Z)">
          <span>
            <IconButton
              size="small"
              onClick={onUndo}
              disabled={!canUndo}
              sx={{ color: canUndo ? '#fff' : 'rgba(255,255,255,0.3)' }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y)">
          <span>
            <IconButton
              size="small"
              onClick={onRedo}
              disabled={!canRedo}
              sx={{ color: canRedo ? '#fff' : 'rgba(255,255,255,0.3)' }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 0.5 }} />

        {/* Pointer / Select */}
        <Tooltip title="Select & Edit Objects">
          <IconButton
            size="small"
            onClick={() => onSetToolMode('select')}
            sx={{
              bgcolor: toolMode === 'select' ? '#3b82f6' : 'transparent',
              color: '#fff',
              '&:hover': { bgcolor: toolMode === 'select' ? '#2563eb' : 'rgba(255,255,255,0.1)' }
            }}
          >
            <MouseIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Text */}
        <Tooltip title="Add or Edit Text">
          <IconButton
            size="small"
            onClick={() => onSetToolMode('text')}
            sx={{
              bgcolor: toolMode === 'text' ? '#3b82f6' : 'transparent',
              color: '#fff',
              '&:hover': { bgcolor: toolMode === 'text' ? '#2563eb' : 'rgba(255,255,255,0.1)' }
            }}
          >
            <TitleIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Shapes Menu */}
        <Tooltip title="Add Shapes">
          <IconButton
            size="small"
            onClick={(e) => setShapeAnchorEl(e.currentTarget)}
            sx={{
              bgcolor: ['rectangle', 'circle', 'line', 'arrow'].includes(toolMode) ? '#3b82f6' : 'transparent',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <ShapeLineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={shapeAnchorEl}
          open={Boolean(shapeAnchorEl)}
          onClose={() => setShapeAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              onSetToolMode('rectangle');
              setShapeAnchorEl(null);
            }}
          >
            <CropSquareIcon sx={{ mr: 1 }} /> Rectangle
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSetToolMode('circle');
              setShapeAnchorEl(null);
            }}
          >
            <RadioButtonUncheckedIcon sx={{ mr: 1 }} /> Circle / Ellipse
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSetToolMode('line');
              setShapeAnchorEl(null);
            }}
          >
            <ShowChartIcon sx={{ mr: 1 }} /> Line
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSetToolMode('arrow');
              setShapeAnchorEl(null);
            }}
          >
            <ArrowRightAltIcon sx={{ mr: 1 }} /> Arrow
          </MenuItem>
        </Menu>

        {/* Freehand Draw */}
        <Tooltip title="Freehand Draw / Pen">
          <IconButton
            size="small"
            onClick={() => onSetToolMode('freehand')}
            sx={{
              bgcolor: toolMode === 'freehand' ? '#3b82f6' : 'transparent',
              color: '#fff',
              '&:hover': { bgcolor: toolMode === 'freehand' ? '#2563eb' : 'rgba(255,255,255,0.1)' }
            }}
          >
            <CreateIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Highlight */}
        <Tooltip title="Highlight Text">
          <IconButton
            size="small"
            onClick={() => onSetToolMode('highlight')}
            sx={{
              bgcolor: toolMode === 'highlight' ? '#eab308' : 'transparent',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <HighlightIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Whiteout Eraser */}
        <Tooltip title="Whiteout / Cover Content">
          <IconButton
            size="small"
            onClick={() => onSetToolMode('whiteout')}
            sx={{
              bgcolor: toolMode === 'whiteout' ? '#ef4444' : 'transparent',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <AutoFixHighIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Image Upload */}
        <Tooltip title="Insert Image">
          <IconButton size="small" onClick={onImageUploadClick} sx={{ color: '#fff' }}>
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Signature */}
        <Tooltip title="Add Signature">
          <IconButton
            size="small"
            onClick={onSignatureModalOpen}
            sx={{
              bgcolor: toolMode === 'signature' ? '#8b5cf6' : 'transparent',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <GestureIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

      {/* 2. Page Actions Group */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="Add Blank Page">
          <IconButton size="small" onClick={onAddBlankPage} sx={{ color: '#fff' }}>
            <AddPageIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Rotate Current Page (90°)">
          <IconButton size="small" onClick={onRotateCurrentPage} sx={{ color: '#fff' }}>
            <RotateRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Duplicate Current Page">
          <IconButton size="small" onClick={onDuplicateCurrentPage} sx={{ color: '#fff' }}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Current Page">
          <IconButton size="small" onClick={onDeleteCurrentPage} sx={{ color: '#ef4444' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

      {/* 3. Zoom Controls Group */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="Zoom Out">
          <IconButton size="small" onClick={onZoomOut} sx={{ color: '#fff' }}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" sx={{ px: 1, fontWeight: 'bold' }}>
          {Math.round(zoomLevel * 100)}%
        </Typography>
        <Tooltip title="Zoom In">
          <IconButton size="small" onClick={onZoomIn} sx={{ color: '#fff' }}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fit to Width">
          <IconButton size="small" onClick={onFitWidth} sx={{ color: '#fff' }}>
            <AspectRatioIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fit to Page">
          <IconButton size="small" onClick={onFitPage} sx={{ color: '#fff' }}>
            <FitScreenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

      {/* 4. AI & Export Action Buttons */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          size="small"
          variant="outlined"
          startIcon={<AutoAwesomeIcon sx={{ color: '#a855f7' }} />}
          onClick={onAiModalOpen}
          sx={{
            borderColor: '#a855f7',
            color: '#a855f7',
            borderRadius: 2,
            '&:hover': { bgcolor: 'rgba(168, 85, 247, 0.12)', borderColor: '#c084fc' }
          }}
        >
          Genkit AI
        </Button>

        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={onSaveAndExport}
          disabled={isSaving}
          sx={{ fontWeight: 'bold', borderRadius: 2 }}
        >
          {isSaving ? 'Applying Changes...' : 'Save Changes'}
        </Button>

        {hasResult && (
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={onDownloadResult}
            sx={{ fontWeight: 'bold', borderRadius: 2 }}
          >
            Download PDF
          </Button>
        )}
      </Stack>
    </Box>
  );
}
