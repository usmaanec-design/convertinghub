import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Tooltip
} from '@mui/material';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { PdfPageObject } from '../pdfEditorTypes';

export interface PdfEditorThumbnailSidebarProps {
  pages: PdfPageObject[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onRotatePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  pdfDocProxy: any;
  isOpen: boolean;
}

export default function PdfEditorThumbnailSidebar({
  pages,
  activePageIndex,
  onSelectPage,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  pdfDocProxy,
  isOpen
}: PdfEditorThumbnailSidebarProps) {
  if (!isOpen) return null;

  return (
    <Box
      sx={{
        width: 220,
        minWidth: 220,
        height: '100%',
        bgcolor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        py: 2,
        px: 1.5,
        userSelect: 'none'
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: '#64748b',
          px: 1,
          mb: 1.5,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        Pages ({pages.length})
      </Typography>

      <Stack spacing={2} alignItems="center">
        {pages.map((page, index) => {
          const isActive = index === activePageIndex;
          return (
            <Box
              key={`thumb_${page.pageIndex}_${index}`}
              onClick={() => onSelectPage(index)}
              sx={{
                width: 170,
                cursor: 'pointer',
                borderRadius: 2,
                p: 1,
                bgcolor: isActive ? '#eff6ff' : '#f8fafc',
                border: '2px solid',
                borderColor: isActive ? '#2563eb' : '#e2e8f0',
                transition: 'all 0.15s ease',
                position: 'relative',
                '&:hover': {
                  borderColor: isActive ? '#1d4ed8' : '#cbd5e1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  '& .thumb-actions': { opacity: 1 }
                }
              }}
            >
              {/* THUMBNAIL CANVAS */}
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  bgcolor: '#ffffff',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <ThumbnailCanvas
                  pdfDocProxy={pdfDocProxy}
                  pageIndex={page.pageIndex}
                  rotation={page.rotation}
                />
              </Box>

              {/* PAGE NUMBER */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  mt: 0.8,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#2563eb' : '#475569',
                  fontSize: '12px'
                }}
              >
                Page {index + 1}
              </Typography>

              {/* HOVER ACTIONS TOOLBAR */}
              <Box
                className="thumb-actions"
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 1.5,
                  p: 0.2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  display: 'flex',
                  gap: 0.2,
                  opacity: 0,
                  transition: 'opacity 0.15s ease'
                }}
              >
                <Tooltip title="Rotate 90°">
                  <IconButton size="small" onClick={() => onRotatePage(index)} sx={{ p: 0.4 }}>
                    <RotateRightIcon sx={{ fontSize: 16, color: '#475569' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate">
                  <IconButton size="small" onClick={() => onDuplicatePage(index)} sx={{ p: 0.4 }}>
                    <ContentCopyIcon sx={{ fontSize: 16, color: '#475569' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => onDeletePage(index)} sx={{ p: 0.4 }}>
                    <DeleteOutlineIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

// Subcomponent to render PDF page onto thumbnail canvas
function ThumbnailCanvas({
  pdfDocProxy,
  pageIndex,
  rotation
}: {
  pdfDocProxy: any;
  pageIndex: number;
  rotation: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderThumbnail = async () => {
      if (!pdfDocProxy || !canvasRef.current) return;
      try {
        const page = await pdfDocProxy.getPage(pageIndex + 1);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: 0.3, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport
          }).promise;
        }
      } catch (err) {
        console.warn('Thumbnail render error:', err);
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, pageIndex, rotation]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  );
}
