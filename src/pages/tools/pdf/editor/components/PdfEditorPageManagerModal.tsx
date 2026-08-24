import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Checkbox,
  Grid
} from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';

import { PdfPageObject } from '../pdfEditorTypes';

export interface PdfEditorPageManagerModalProps {
  open: boolean;
  onClose: () => void;
  pages: PdfPageObject[];
  onUpdatePages: (newPages: PdfPageObject[]) => void;
  pdfDocProxy: any;
  onImportPdfFile?: (file: File) => void;
}

export default function PdfEditorPageManagerModal({
  open,
  onClose,
  pages,
  onUpdatePages,
  pdfDocProxy,
  onImportPdfFile
}: PdfEditorPageManagerModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleToggleSelect = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIndices.length === pages.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(pages.map((_, i) => i));
    }
  };

  const handleRotateSelected = (delta: number) => {
    const updated = pages.map((page, idx) => {
      if (selectedIndices.length === 0 || selectedIndices.includes(idx)) {
        return {
          ...page,
          rotation: (page.rotation + delta + 360) % 360
        };
      }
      return page;
    });
    onUpdatePages(updated);
  };

  const handleDuplicateSelected = () => {
    const targets = selectedIndices.length > 0 ? selectedIndices : [0];
    const newPages = [...pages];
    targets.forEach((targetIdx) => {
      const pageToDup = pages[targetIdx];
      newPages.push({ ...pageToDup });
    });
    onUpdatePages(newPages);
  };

  const handleDeleteSelected = () => {
    if (pages.length <= 1) return;
    const targets = selectedIndices.length > 0 ? selectedIndices : [0];
    const updated = pages.filter((_, idx) => !targets.includes(idx));
    onUpdatePages(updated);
    setSelectedIndices([]);
  };

  const handleAddBlankPage = () => {
    const newPage: PdfPageObject = {
      pageIndex: 99999,
      originalRotation: 0,
      rotation: 0,
      width: 612,
      height: 792,
      aspectRatio: 612 / 792,
      pdfPageWidth: 612,
      pdfPageHeight: 792
    };
    onUpdatePages([...pages, newPage]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
          Manage PDF Pages
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {/* MANAGEMENT TOOLBAR */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
          sx={{
            p: 1.5,
            bgcolor: '#ffffff',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            mb: 3
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              onClick={handleSelectAll}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {selectedIndices.length === pages.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              ({selectedIndices.length} selected)
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Rotate Left">
              <IconButton size="small" onClick={() => handleRotateSelected(-90)}>
                <RotateLeftIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate Right">
              <IconButton size="small" onClick={() => handleRotateSelected(90)}>
                <RotateRightIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Duplicate">
              <IconButton size="small" onClick={handleDuplicateSelected}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDeleteSelected}
                  disabled={pages.length <= 1}
                  sx={{ color: '#ef4444' }}
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              startIcon={<NoteAddIcon />}
              onClick={handleAddBlankPage}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Add Blank Page
            </Button>
          </Stack>
        </Stack>

        {/* PAGES GRID */}
        <Grid container spacing={3}>
          {pages.map((page, index) => {
            const isSelected = selectedIndices.includes(index);
            return (
              <Grid item xs={6} sm={4} md={3} key={`mgr_${index}`}>
                <Box
                  onClick={() => handleToggleSelect(index)}
                  sx={{
                    bgcolor: '#ffffff',
                    borderRadius: 3,
                    p: 1.5,
                    border: '2px solid',
                    borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                    boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    size="small"
                    sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}
                  />

                  <Box
                    sx={{
                      height: 180,
                      bgcolor: '#f1f5f9',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                      Page {index + 1}
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textAlign: 'center',
                      mt: 1,
                      fontWeight: 700,
                      color: '#334155'
                    }}
                  >
                    Page {index + 1}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
        <Button variant="contained" onClick={onClose} sx={{ fontWeight: 700, px: 3, textTransform: 'none' }}>
          Done Managing Pages
        </Button>
      </DialogActions>
    </Dialog>
  );
}
