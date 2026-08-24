import React from 'react';
import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  Typography,
  Divider,
  Slider
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { EditorToolMode, EditorActiveSelection } from '../pdfEditorTypes';

export interface PdfEditorSecondaryToolbarProps {
  toolMode: EditorToolMode;
  activeSelection: EditorActiveSelection;
  onUpdateSelection: (updates: Partial<EditorActiveSelection>) => void;
  onDeleteSelection: () => void;
  onDuplicateSelection: () => void;
}

const FONT_FAMILIES = ['Helvetica', 'Times New Roman', 'Courier', 'Arial', 'Georgia', 'Verdana'];
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

export default function PdfEditorSecondaryToolbar({
  toolMode,
  activeSelection,
  onUpdateSelection,
  onDeleteSelection,
  onDuplicateSelection
}: PdfEditorSecondaryToolbarProps) {
  const isTextTool = toolMode === 'text' || toolMode === 'editText' || activeSelection.type === 'text';
  const isDrawTool = toolMode === 'freehand' || toolMode === 'line' || toolMode === 'arrow' || toolMode === 'rectangle' || toolMode === 'circle';
  const isHighlightTool = toolMode === 'highlight';
  const hasObjectSelected = activeSelection.type !== 'none' && Boolean(activeSelection.id);

  const rawFont = activeSelection.fontFamily || 'Helvetica';
  const selectedFont = FONT_FAMILIES.includes(rawFont) ? rawFont : 'Helvetica';

  const rawSize = activeSelection.fontSize || 14;
  const selectedSize = FONT_SIZES.includes(rawSize) ? rawSize : FONT_SIZES.reduce((prev, curr) => Math.abs(curr - rawSize) < Math.abs(prev - rawSize) ? curr : prev);

  if (!isTextTool && !isDrawTool && !isHighlightTool && !hasObjectSelected) {
    return null;
  }

  return (
    <Box
      sx={{
        px: 3,
        py: 0.6,
        bgcolor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        {/* TEXT TOOL CONTROLS */}
        {isTextTool && (
          <>
            {/* Font Family */}
            <Select
              size="small"
              value={selectedFont}
              onChange={(e) => onUpdateSelection({ fontFamily: e.target.value })}
              sx={{
                height: 32,
                fontSize: 13,
                bgcolor: '#ffffff',
                '& .MuiSelect-select': { py: 0.5, px: 1.5 }
              }}
            >
              {FONT_FAMILIES.map((font) => (
                <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </MenuItem>
              ))}
            </Select>

            {/* Font Size */}
            <Select
              size="small"
              value={selectedSize}
              onChange={(e) => onUpdateSelection({ fontSize: Number(e.target.value) })}
              sx={{
                height: 32,
                fontSize: 13,
                bgcolor: '#ffffff',
                width: 75
              }}
            >
              {FONT_SIZES.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}px
                </MenuItem>
              ))}
            </Select>

            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

            {/* Text Color */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Color</Typography>
              <input
                type="color"
                value={activeSelection.color || '#000000'}
                onChange={(e) => onUpdateSelection({ color: e.target.value })}
                style={{
                  width: 28,
                  height: 28,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: 0,
                  backgroundColor: 'transparent'
                }}
              />
            </Stack>

            {/* Text Background Color */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Highlight</Typography>
              <input
                type="color"
                value={activeSelection.bgColor || '#ffffff'}
                onChange={(e) => onUpdateSelection({ bgColor: e.target.value })}
                style={{
                  width: 28,
                  height: 28,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: 0,
                  backgroundColor: 'transparent'
                }}
              />
            </Stack>

            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

            {/* Formatting Toggles */}
            <Tooltip title="Bold">
              <IconButton
                size="small"
                onClick={() => onUpdateSelection({ bold: !activeSelection.bold })}
                sx={{
                  bgcolor: activeSelection.bold ? '#cbd5e1' : 'transparent',
                  color: activeSelection.bold ? '#0f172a' : '#475569'
                }}
              >
                <FormatBoldIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton
                size="small"
                onClick={() => onUpdateSelection({ italic: !activeSelection.italic })}
                sx={{
                  bgcolor: activeSelection.italic ? '#cbd5e1' : 'transparent',
                  color: activeSelection.italic ? '#0f172a' : '#475569'
                }}
              >
                <FormatItalicIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline">
              <IconButton
                size="small"
                onClick={() => onUpdateSelection({ underline: !activeSelection.underline })}
                sx={{
                  bgcolor: activeSelection.underline ? '#cbd5e1' : 'transparent',
                  color: activeSelection.underline ? '#0f172a' : '#475569'
                }}
              >
                <FormatUnderlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

            {/* Alignment */}
            <Tooltip title="Align Left">
              <IconButton
                size="small"
                onClick={() => onUpdateSelection({ alignment: 'left' })}
                sx={{ bgcolor: activeSelection.alignment === 'left' ? '#e2e8f0' : 'transparent' }}
              >
                <FormatAlignLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Center">
              <IconButton
                size="small"
                onClick={() => onUpdateSelection({ alignment: 'center' })}
                sx={{ bgcolor: activeSelection.alignment === 'center' ? '#e2e8f0' : 'transparent' }}
              >
                <FormatAlignCenterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Right">
              <IconButton
                size="small"
                onClick={() => onUpdateSelection({ alignment: 'right' })}
                sx={{ bgcolor: activeSelection.alignment === 'right' ? '#e2e8f0' : 'transparent' }}
              >
                <FormatAlignRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* DRAW & SHAPE CONTROLS */}
        {(isDrawTool || isHighlightTool) && (
          <>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Stroke Color</Typography>
              <input
                type="color"
                value={activeSelection.strokeColor || '#2563eb'}
                onChange={(e) => onUpdateSelection({ strokeColor: e.target.value })}
                style={{
                  width: 28,
                  height: 28,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: 0
                }}
              />
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Fill Color</Typography>
              <input
                type="color"
                value={activeSelection.fillColor || '#ffff00'}
                onChange={(e) => onUpdateSelection({ fillColor: e.target.value })}
                style={{
                  width: 28,
                  height: 28,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: 0
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 140, ml: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Width</Typography>
              <Slider
                size="small"
                min={1}
                max={20}
                value={activeSelection.strokeWidth || 3}
                onChange={(_, val) => onUpdateSelection({ strokeWidth: val as number })}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 140, ml: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Opacity</Typography>
              <Slider
                size="small"
                min={0.1}
                max={1}
                step={0.05}
                value={activeSelection.opacity ?? 1}
                onChange={(_, val) => onUpdateSelection({ opacity: val as number })}
              />
            </Stack>
          </>
        )}
      </Stack>

      {/* SELECTION ACTIONS: Delete & Duplicate */}
      {hasObjectSelected && (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Duplicate Object">
            <IconButton size="small" onClick={onDuplicateSelection} sx={{ color: '#475569' }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Object (Delete key)">
            <IconButton size="small" onClick={onDeleteSelection} sx={{ color: '#ef4444' }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
}
