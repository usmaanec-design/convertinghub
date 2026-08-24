import React, { useState } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Typography,
  Stack,
  Divider,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';

export interface PdfEditorSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearchQueryChange: (query: string) => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  matchIndex: number;
  totalMatches: number;
}

export default function PdfEditorSearchModal({
  open,
  onClose,
  onSearchQueryChange,
  onNextMatch,
  onPrevMatch,
  matchIndex,
  totalMatches
}: PdfEditorSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearchQueryChange(val);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        top: 130,
        right: 32,
        zIndex: 1200,
        p: '4px 12px',
        display: 'flex',
        alignItems: 'center',
        width: 380,
        borderRadius: 3,
        border: '1px solid #cbd5e1',
        bgcolor: '#ffffff'
      }}
    >
      <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />
      <InputBase
        placeholder="Search text in PDF..."
        value={searchTerm}
        onChange={handleChange}
        autoFocus
        sx={{ ml: 0.5, flex: 1, fontSize: 14 }}
      />

      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, px: 1, minWidth: 65, textAlign: 'center' }}>
        {totalMatches > 0 ? `${matchIndex + 1} of ${totalMatches}` : 'No results'}
      </Typography>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.8 }} />

      <Stack direction="row" spacing={0.2}>
        <Tooltip title="Previous match">
          <span>
            <IconButton size="small" onClick={onPrevMatch} disabled={totalMatches === 0}>
              <NavigateBeforeIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Next match">
          <span>
            <IconButton size="small" onClick={onNextMatch} disabled={totalMatches === 0}>
              <NavigateNextIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Close Search">
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
