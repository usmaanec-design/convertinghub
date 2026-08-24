import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Slider,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Divider
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import DeleteIcon from '@mui/icons-material/Delete';
import FlipToFrontIcon from '@mui/icons-material/FlipToFront';
import FlipToBackIcon from '@mui/icons-material/FlipToBack';
import ColorLensIcon from '@mui/icons-material/ColorLens';

import { EditorActiveSelection } from '../pdfEditorTypes';

export interface PdfEditorPropertiesPanelProps {
  selection: EditorActiveSelection;
  onUpdateSelection: (updates: Partial<EditorActiveSelection>) => void;
  onDeleteSelectedObject: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

const COLOR_SWATCHES = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b'
];

export default function PdfEditorPropertiesPanel({
  selection,
  onUpdateSelection,
  onDeleteSelectedObject,
  onBringForward,
  onSendBackward
}: PdfEditorPropertiesPanelProps) {
  if (selection.type === 'none') {
    return (
      <Paper
        sx={{
          width: 220,
          minWidth: 220,
          p: 2,
          bgcolor: '#0f172a',
          color: 'rgba(255,255,255,0.6)',
          borderRadius: 3,
          boxShadow: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 4 }}>
          Select any element on the canvas to inspect & edit properties.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        width: 240,
        minWidth: 240,
        p: 2,
        bgcolor: '#0f172a',
        color: '#fff',
        borderRadius: 3,
        boxShadow: 3,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#60a5fa' }}>
            {selection.type.toUpperCase()} PROPERTIES
          </Typography>
          <Tooltip title="Delete Selected Element">
            <IconButton size="small" onClick={onDeleteSelectedObject} sx={{ color: '#ef4444' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* 1. TEXT PROPERTIES */}
        {selection.type === 'text' && (
          <Stack spacing={2}>
            {/* Edit Text Content */}
            <TextField
              size="small"
              multiline
              rows={2}
              label="Text Content"
              value={selection.text || ''}
              onChange={(e) => onUpdateSelection({ text: e.target.value })}
              sx={{
                '& .MuiInputBase-root': {
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
              }}
            />

            {/* Font Family */}
            <FormControl size="small">
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Font Family</InputLabel>
              <Select
                value={selection.fontFamily || 'Helvetica'}
                label="Font Family"
                onChange={(e) => onUpdateSelection({ fontFamily: e.target.value })}
                sx={{
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <MenuItem value="Helvetica">Helvetica / Arial</MenuItem>
                <MenuItem value="Times">Times New Roman</MenuItem>
                <MenuItem value="Courier">Courier New</MenuItem>
                <MenuItem value="Georgia">Georgia</MenuItem>
                <MenuItem value="Trebuchet MS">Trebuchet MS</MenuItem>
              </Select>
            </FormControl>

            {/* Font Size */}
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Font Size: {selection.fontSize || 14}px
              </Typography>
              <Slider
                size="small"
                value={selection.fontSize || 14}
                min={8}
                max={72}
                onChange={(_, val) => onUpdateSelection({ fontSize: val as number })}
                sx={{ color: '#3b82f6' }}
              />
            </Box>

            {/* Formatting Toggles */}
            <Stack direction="row" spacing={0.5} justifyContent="center">
              <ToggleButton
                size="small"
                value="bold"
                selected={Boolean(selection.bold)}
                onChange={() => onUpdateSelection({ bold: !selection.bold })}
                sx={{ color: '#fff', '&.Mui-selected': { bgcolor: '#3b82f6', color: '#fff' } }}
              >
                <FormatBoldIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton
                size="small"
                value="italic"
                selected={Boolean(selection.italic)}
                onChange={() => onUpdateSelection({ italic: !selection.italic })}
                sx={{ color: '#fff', '&.Mui-selected': { bgcolor: '#3b82f6', color: '#fff' } }}
              >
                <FormatItalicIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton
                size="small"
                value="underline"
                selected={Boolean(selection.underline)}
                onChange={() => onUpdateSelection({ underline: !selection.underline })}
                sx={{ color: '#fff', '&.Mui-selected': { bgcolor: '#3b82f6', color: '#fff' } }}
              >
                <FormatUnderlinedIcon fontSize="small" />
              </ToggleButton>
            </Stack>

            {/* Text Color Picker */}
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5, display: 'block' }}>
                Text Color:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {COLOR_SWATCHES.map((color) => (
                  <Box
                    key={color}
                    onClick={() => onUpdateSelection({ color })}
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: color,
                      border: selection.color === color ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        )}

        {/* 2. SHAPE PROPERTIES */}
        {selection.type === 'shape' && (
          <Stack spacing={2}>
            {/* Fill Color */}
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5, display: 'block' }}>
                Fill Color:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {COLOR_SWATCHES.map((color) => (
                  <Box
                    key={`fill_${color}`}
                    onClick={() => onUpdateSelection({ fillColor: color })}
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: 1,
                      bgcolor: color,
                      border: selection.fillColor === color ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Stroke Color */}
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5, display: 'block' }}>
                Border Color:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {COLOR_SWATCHES.map((color) => (
                  <Box
                    key={`stroke_${color}`}
                    onClick={() => onUpdateSelection({ strokeColor: color })}
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: 1,
                      bgcolor: color,
                      border: selection.strokeColor === color ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Stroke Width */}
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Border Thickness: {selection.strokeWidth || 1}px
              </Typography>
              <Slider
                size="small"
                value={selection.strokeWidth || 1}
                min={0}
                max={20}
                onChange={(_, val) => onUpdateSelection({ strokeWidth: val as number })}
                sx={{ color: '#3b82f6' }}
              />
            </Box>
          </Stack>
        )}

        {/* 3. COMMON PROPERTIES (Opacity, Rotation, Ordering) */}
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Opacity: {Math.round((selection.opacity ?? 1) * 100)}%
          </Typography>
          <Slider
            size="small"
            value={selection.opacity ?? 1}
            step={0.05}
            min={0.1}
            max={1}
            onChange={(_, val) => onUpdateSelection({ opacity: val as number })}
            sx={{ color: '#3b82f6' }}
          />
        </Box>

        {/* Layer Ordering */}
        <Stack direction="row" spacing={1} justifyContent="center" mt={1}>
          <Tooltip title="Bring Forward">
            <Button
              size="small"
              variant="outlined"
              startIcon={<FlipToFrontIcon />}
              onClick={onBringForward}
              sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11 }}
            >
              Forward
            </Button>
          </Tooltip>
          <Tooltip title="Send Backward">
            <Button
              size="small"
              variant="outlined"
              startIcon={<FlipToBackIcon />}
              onClick={onSendBackward}
              sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11 }}
            >
              Backward
            </Button>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}
