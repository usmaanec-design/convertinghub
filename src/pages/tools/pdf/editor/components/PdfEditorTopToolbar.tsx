import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Divider,
  Typography,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DrawIcon from '@mui/icons-material/Draw';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HighlightIcon from '@mui/icons-material/Highlight';
import ImageIcon from '@mui/icons-material/Image';
import ApprovalIcon from '@mui/icons-material/Approval';
import LinkIcon from '@mui/icons-material/Link';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import LayersIcon from '@mui/icons-material/Layers';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

import { EditorToolMode } from '../pdfEditorTypes';

export interface PdfEditorTopToolbarProps {
  toolMode: EditorToolMode;
  onSetToolMode: (mode: EditorToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSignatureModal: () => void;
  onImageUploadClick: () => void;
  onOpenStampModal: () => void;
  onOpenPageManager: () => void;
  onOpenSearchModal: () => void;
  onPrint: () => void;
}

export default function PdfEditorTopToolbar({
  toolMode,
  onSetToolMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isSidebarOpen,
  onToggleSidebar,
  onOpenSignatureModal,
  onImageUploadClick,
  onOpenStampModal,
  onOpenPageManager,
  onOpenSearchModal,
  onPrint
}: PdfEditorTopToolbarProps) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null);

  const renderToolButton = (
    mode: EditorToolMode | 'action',
    icon: React.ReactNode,
    label: string,
    onClick?: () => void,
    disabled = false,
    isActive = false
  ) => {
    const active = isActive || (mode !== 'action' && toolMode === mode);
    return (
      <Tooltip title={label} arrow>
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={onClick || (() => mode !== 'action' && onSetToolMode(mode as EditorToolMode))}
            sx={{
              px: 1.2,
              py: 0.8,
              borderRadius: '8px',
              bgcolor: active ? '#eff6ff' : 'transparent',
              color: active ? '#2563eb' : disabled ? '#cbd5e1' : '#475569',
              border: active ? '1px solid #bfdbfe' : '1px solid transparent',
              flexDirection: 'column',
              gap: 0.25,
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: active ? '#dbeafe' : '#f1f5f9',
                color: active ? '#1d4ed8' : '#0f172a'
              }
            }}
          >
            {icon}
            <Typography
              variant="caption"
              sx={{
                fontSize: '11px',
                fontWeight: active ? 700 : 500,
                color: 'inherit',
                lineHeight: 1
              }}
            >
              {label}
            </Typography>
          </IconButton>
        </span>
      </Tooltip>
    );
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 0.8,
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)'
      }}
    >
      {/* LEFT SECTION: View Sidebar & History */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        {renderToolButton(
          'action',
          <ViewSidebarIcon sx={{ fontSize: 20 }} />,
          'Sidebar',
          onToggleSidebar,
          false,
          isSidebarOpen
        )}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.8, my: 0.8, borderColor: '#e2e8f0' }} />

        {renderToolButton('action', <UndoIcon sx={{ fontSize: 20 }} />, 'Undo', onUndo, !canUndo)}
        {renderToolButton('action', <RedoIcon sx={{ fontSize: 20 }} />, 'Redo', onRedo, !canRedo)}
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.8, borderColor: '#e2e8f0' }} />

      {/* CENTER SECTION: Core Editing Tools */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        {renderToolButton('text', <TextFieldsIcon sx={{ fontSize: 20 }} />, 'Add Text')}
        {renderToolButton('editText', <EditNoteIcon sx={{ fontSize: 20 }} />, 'Edit Text')}
        {renderToolButton('signature', <DrawIcon sx={{ fontSize: 20 }} />, 'Sign', onOpenSignatureModal)}
        {renderToolButton('freehand', <BorderColorIcon sx={{ fontSize: 20 }} />, 'Draw')}
        {renderToolButton('line', <ShowChartIcon sx={{ fontSize: 20 }} />, 'Line')}
        {renderToolButton('highlight', <HighlightIcon sx={{ fontSize: 20 }} />, 'Highlight')}
        {renderToolButton('image', <ImageIcon sx={{ fontSize: 20 }} />, 'Image', onImageUploadClick)}
        {renderToolButton('stamp', <ApprovalIcon sx={{ fontSize: 20 }} />, 'Stamp', onOpenStampModal)}

        {!isCompact && (
          <>
            {renderToolButton('link', <LinkIcon sx={{ fontSize: 20 }} />, 'Link')}
            {renderToolButton('note', <StickyNote2Icon sx={{ fontSize: 20 }} />, 'Note')}
          </>
        )}
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.8, borderColor: '#e2e8f0' }} />

      {/* RIGHT SECTION: Document Utilities */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        {renderToolButton('action', <LayersIcon sx={{ fontSize: 20 }} />, 'Pages', onOpenPageManager)}
        {renderToolButton('action', <PrintIcon sx={{ fontSize: 20 }} />, 'Print', onPrint)}
        {renderToolButton('action', <SearchIcon sx={{ fontSize: 20 }} />, 'Search', onOpenSearchModal)}

        {isCompact && (
          <>
            <IconButton
              size="small"
              onClick={(e) => setMoreAnchorEl(e.currentTarget)}
              sx={{ p: 1, color: '#475569' }}
            >
              <MoreHorizIcon />
            </IconButton>
            <Menu
              anchorEl={moreAnchorEl}
              open={Boolean(moreAnchorEl)}
              onClose={() => setMoreAnchorEl(null)}
            >
              <MenuItem onClick={() => { onSetToolMode('link'); setMoreAnchorEl(null); }}>
                <LinkIcon sx={{ mr: 1.5, fontSize: 20 }} /> Link
              </MenuItem>
              <MenuItem onClick={() => { onSetToolMode('note'); setMoreAnchorEl(null); }}>
                <StickyNote2Icon sx={{ mr: 1.5, fontSize: 20 }} /> Note
              </MenuItem>
            </Menu>
          </>
        )}
      </Stack>
    </Box>
  );
}
