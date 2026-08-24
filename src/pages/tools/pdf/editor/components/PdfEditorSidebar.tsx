import React, { useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Button
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';

import { PdfPageObject } from '../pdfEditorTypes';

export interface PdfEditorSidebarProps {
  pages: PdfPageObject[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onRotatePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onAddBlankPage: () => void;
  pdfDocProxy: any;
}

export default function PdfEditorSidebar({
  pages,
  activePageIndex,
  onSelectPage,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  onAddBlankPage,
  pdfDocProxy
}: PdfEditorSidebarProps) {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [targetPageIndex, setTargetPageIndex] = React.useState<number>(0);

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, index: number) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setTargetPageIndex(index);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Paper
      sx={{
        width: 180,
        minWidth: 180,
        height: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        p: 1.5,
        bgcolor: '#0f172a',
        color: '#fff',
        borderRadius: 3,
        boxShadow: 3
      }}
    >
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" fontWeight="bold">
            Pages ({pages.length})
          </Typography>
          <Tooltip title="Add Blank Page">
            <IconButton size="small" onClick={onAddBlankPage} sx={{ color: '#3b82f6' }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Stack spacing={1.5}>
          {pages.map((pageObj, idx) => (
            <Box
              key={`thumb_${idx}_${pageObj.pageIndex}`}
              onClick={() => onSelectPage(idx)}
              sx={{
                p: 1,
                borderRadius: 2,
                border: '2px solid',
                borderColor: activePageIndex === idx ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                bgcolor: activePageIndex === idx ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#3b82f6',
                  bgcolor: 'rgba(59,130,246,0.1)'
                }
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="caption" fontWeight="bold" sx={{ color: activePageIndex === idx ? '#60a5fa' : '#94a3b8' }}>
                  Page {idx + 1}
                </Typography>

                <IconButton
                  size="small"
                  onClick={(e) => handleOpenMenu(e, idx)}
                  sx={{ color: 'rgba(255,255,255,0.6)', p: 0.2 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Render Canvas Preview Thumbnail */}
              <ThumbnailCanvas pdfDocProxy={pdfDocProxy} pageObj={pageObj} pageIndex={pageObj.pageIndex} />
            </Box>
          ))}
        </Stack>
      </Stack>

      {/* Page Actions Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            onRotatePage(targetPageIndex);
            handleCloseMenu();
          }}
        >
          <RotateRightIcon sx={{ mr: 1 }} fontSize="small" /> Rotate 90°
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDuplicatePage(targetPageIndex);
            handleCloseMenu();
          }}
        >
          <ContentCopyIcon sx={{ mr: 1 }} fontSize="small" /> Duplicate Page
        </MenuItem>
        {targetPageIndex > 0 && (
          <MenuItem
            onClick={() => {
              onMovePage(targetPageIndex, targetPageIndex - 1);
              handleCloseMenu();
            }}
          >
            <ArrowUpwardIcon sx={{ mr: 1 }} fontSize="small" /> Move Up
          </MenuItem>
        )}
        {targetPageIndex < pages.length - 1 && (
          <MenuItem
            onClick={() => {
              onMovePage(targetPageIndex, targetPageIndex + 1);
              handleCloseMenu();
            }}
          >
            <ArrowDownwardIcon sx={{ mr: 1 }} fontSize="small" /> Move Down
          </MenuItem>
        )}
        {pages.length > 1 && (
          <MenuItem
            onClick={() => {
              onDeletePage(targetPageIndex);
              handleCloseMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" /> Delete Page
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
}

// Inner Thumbnail Renderer
function ThumbnailCanvas({ pdfDocProxy, pageObj, pageIndex }: { pdfDocProxy: any; pageObj: PdfPageObject; pageIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderThumb = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!pdfDocProxy || pageIndex >= pdfDocProxy.numPages) {
        // Render blank page placeholder
        canvas.width = 120;
        canvas.height = 160;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText('Blank Page', 30, 80);
        return;
      }

      try {
        const page = await pdfDocProxy.getPage(pageIndex + 1);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: 0.25, rotation: pageObj.rotation || 0 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport
        }).promise;
      } catch (err) {
        console.warn('Thumbnail render fallback:', err);
      }
    };

    renderThumb();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, pageIndex, pageObj.rotation]);

  return (
    <Box display="flex" justifyContent="center">
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: 140,
          borderRadius: 4,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
      />
    </Box>
  );
}
