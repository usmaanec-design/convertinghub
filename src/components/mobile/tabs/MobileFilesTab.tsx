import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Grid,
  Checkbox,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fab
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageAltIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import TransformIcon from '@mui/icons-material/Transform';
import CompressIcon from '@mui/icons-material/Compress';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

import MobileFileViewerModal, { FileToView } from '../MobileFileViewerModal';
import PdfGridThumbnail from '../PdfGridThumbnail';

export interface SavedFileItem {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'image' | 'archive' | 'other';
  date: string;
  fileObj?: File;
  previewUrl?: string;
}

export const MobileFilesTab: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Files List
  const [filesList, setFilesList] = useState<SavedFileItem[]>(() => {
    try {
      const saved = localStorage.getItem('convertinghub_mobile_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save metadata to localStorage
  useEffect(() => {
    try {
      const metadata = filesList.map(({ fileObj, previewUrl, ...rest }) => rest);
      localStorage.setItem('convertinghub_mobile_files', JSON.stringify(metadata));
    } catch (e) {
      console.warn('Failed to save files metadata:', e);
    }
  }, [filesList]);

  // Multi-select state
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action Menu Bottom Sheet State
  const [actionFile, setActionFile] = useState<SavedFileItem | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  // Rename Dialog State
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  // Delete Confirm Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // In-App Viewer Modal State
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [selectedFileForViewer, setSelectedFileForViewer] = useState<FileToView | null>(null);

  // Format Selection Modal State for Convert Action
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  // Device File Pick Handler
  const handleDeviceFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked: SavedFileItem[] = [];
    const files = Array.from(e.target.files);

    files.forEach((file, i) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: SavedFileItem['type'] = 'other';
      if (ext === 'pdf') type = 'pdf';
      else if (['docx', 'doc', 'txt'].includes(ext)) type = 'docx';
      else if (['xlsx', 'xls', 'csv'].includes(ext)) type = 'xlsx';
      else if (['pptx', 'ppt'].includes(ext)) type = 'pptx';
      else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) type = 'image';
      else if (['zip', 'rar', '7z'].includes(ext)) type = 'archive';

      let previewUrl = undefined;
      if (type === 'image') {
        previewUrl = URL.createObjectURL(file);
      }

      picked.push({
        id: `${file.name}-${Date.now()}-${i}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type,
        date: new Date(file.lastModified || Date.now()).toLocaleDateString(),
        fileObj: file,
        previewUrl
      });
    });

    setFilesList((prev) => [...picked, ...prev]);
  };

  // Filtered files view
  const filteredFiles = filesList.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'PDF') return item.type === 'pdf';
    if (activeFilter === 'Word') return item.type === 'docx';
    if (activeFilter === 'Excel') return item.type === 'xlsx';
    if (activeFilter === 'PPT') return item.type === 'pptx';
    if (activeFilter === 'Images') return item.type === 'image';
    return true;
  });

  // Open file in viewer or convert
  const handleOpenFile = (item: SavedFileItem) => {
    if (isMultiSelect) {
      toggleSelectFile(item.id);
      return;
    }

    if (item.type === 'pdf') {
      setSelectedFileForViewer({
        name: item.name,
        fileObj: item.fileObj,
        type: 'pdf',
        size: item.size
      });
      setViewerOpen(true);
    } else if (item.type === 'image') {
      setSelectedFileForViewer({
        name: item.name,
        fileObj: item.fileObj,
        url: item.previewUrl,
        type: 'image',
        size: item.size
      });
      setViewerOpen(true);
    } else {
      // Offer conversion for Word/Excel/PPT
      setActionFile(item);
      setConvertModalOpen(true);
    }
  };

  // Long press handler to open action sheet
  const handleCardLongPress = (item: SavedFileItem) => {
    if (isMultiSelect) {
      toggleSelectFile(item.id);
      return;
    }
    setActionFile(item);
    setActionSheetOpen(true);
  };

  // Multi select toggle
  const toggleSelectFile = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Actions
  const handleActionSelectMode = () => {
    setActionSheetOpen(false);
    setIsMultiSelect(true);
    if (actionFile) {
      setSelectedIds(new Set([actionFile.id]));
    }
  };

  const handleActionRename = () => {
    if (!actionFile) return;
    setRenameInput(actionFile.name);
    setActionSheetOpen(false);
    setRenameDialogOpen(true);
  };

  const saveRename = () => {
    if (!actionFile || !renameInput.trim()) return;
    setFilesList((prev) =>
      prev.map((f) => (f.id === actionFile.id ? { ...f, name: renameInput.trim() } : f))
    );
    setRenameDialogOpen(false);
    setActionFile(null);
  };

  const handleActionShare = async () => {
    setActionSheetOpen(false);
    if (!actionFile) return;

    if (navigator.share && actionFile.fileObj) {
      try {
        await navigator.share({
          files: [actionFile.fileObj],
          title: actionFile.name
        });
      } catch (e) {
        console.warn('Web Share failed:', e);
      }
    } else {
      alert(`Sharing ${actionFile.name}`);
    }
  };

  const handleActionQuickTool = (toolPath: string) => {
    setActionSheetOpen(false);
    if (actionFile?.fileObj) {
      (window as any).__pendingConversionFile = actionFile.fileObj;
    }
    navigate(toolPath);
  };

  const handleActionDelete = () => {
    setActionSheetOpen(false);
    if (actionFile) {
      setDeleteTargetId(actionFile.id);
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      setFilesList((prev) => prev.filter((f) => f.id !== deleteTargetId));
    }
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
    setActionFile(null);
  };

  // Bulk actions
  const handleBulkDelete = () => {
    setFilesList((prev) => prev.filter((f) => !selectedIds.has(f.id)));
    setSelectedIds(new Set());
    setIsMultiSelect(false);
  };

  const getTypeIcon = (type: SavedFileItem['type']) => {
    switch (type) {
      case 'pdf':
        return <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: 32 }} />;
      case 'docx':
        return <DescriptionIcon sx={{ color: '#3b82f6', fontSize: 32 }} />;
      case 'xlsx':
        return <TableChartIcon sx={{ color: '#10b981', fontSize: 32 }} />;
      case 'pptx':
        return <SlideshowIcon sx={{ color: '#f97316', fontSize: 32 }} />;
      case 'image':
        return <ImageAltIcon sx={{ color: '#10b981', fontSize: 32 }} />;
      case 'archive':
        return <FolderZipIcon sx={{ color: '#f59e0b', fontSize: 32 }} />;
      default:
        return <InsertDriveFileIcon sx={{ color: '#94a3b8', fontSize: 32 }} />;
    }
  };

  return (
    <Box
      sx={{
        px: 2,
        pt: 2,
        pb: 12,
        width: '100%',
        maxWidth: 600,
        mx: 'auto'
      }}
    >
      {/* Hidden Native File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        style={{ display: 'none' }}
        onChange={handleDeviceFilesPicked}
      />

      {/* Header Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Typography variant="h6" fontWeight={800} color="text.primary">
          {isMultiSelect ? `${selectedIds.size} Selected` : `Document Gallery (${filesList.length})`}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {isMultiSelect ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloseIcon />}
              onClick={() => {
                setIsMultiSelect(false);
                setSelectedIds(new Set());
              }}
              sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              Add Files
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter Chips Bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 1.5,
          mb: 2,
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {['All', 'PDF', 'Word', 'Excel', 'PPT', 'Images'].map((filter) => (
          <Chip
            key={filter}
            label={filter}
            clickable
            onClick={() => setActiveFilter(filter)}
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              bgcolor:
                activeFilter === filter
                  ? '#2563eb'
                  : theme.palette.mode === 'dark'
                  ? '#1e293b'
                  : '#f1f5f9',
              color: activeFilter === filter ? '#ffffff' : 'text.primary',
              '&:hover': {
                bgcolor: activeFilter === filter ? '#1d4ed8' : '#e2e8f0'
              }
            }}
          />
        ))}
      </Box>

      {/* Empty State */}
      {filteredFiles.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: '20px',
            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            border: `1px solid ${
              theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
            }`,
            textAlign: 'center'
          }}
        >
          <InsertDriveFileIcon
            sx={{ fontSize: 48, color: '#94a3b8', mb: 1, opacity: 0.6 }}
          />
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            No Documents Available
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, maxWidth: 260, mx: 'auto' }}
          >
            Tap "Add Files" or "Browse Storage" to load PDFs, Word, Excel, and photos from your device.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}
          >
            Browse Phone Storage
          </Button>
        </Paper>
      ) : (
        /* Thumbnail Cards Grid View */
        <Grid container spacing={1.5}>
          {filteredFiles.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <Grid item xs={6} sm={4} key={item.id}>
                <Paper
                  elevation={0}
                  onClick={() => handleOpenFile(item)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleCardLongPress(item);
                  }}
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                    border: `2px solid ${
                      isSelected
                        ? '#2563eb'
                        : theme.palette.mode === 'dark'
                        ? '#334155'
                        : '#e2e8f0'
                    }`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:active': { transform: 'scale(0.97)' }
                  }}
                >
                  {/* Multi-select Checkbox Badge */}
                  {isMultiSelect && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        zIndex: 10
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectFile(item.id)}
                        sx={{
                          color: '#ffffff',
                          '&.Mui-checked': { color: '#2563eb' },
                          bgcolor: 'rgba(0,0,0,0.4)',
                          borderRadius: '50%',
                          p: 0.5
                        }}
                      />
                    </Box>
                  )}

                  {/* Thumbnail / File Card Preview */}
                  <Box
                    sx={{
                      height: 130,
                      width: '100%',
                      bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {item.type === 'pdf' ? (
                      <PdfGridThumbnail fileObj={item.fileObj} />
                    ) : item.type === 'image' && item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {getTypeIcon(item.type)}
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          sx={{ textTransform: 'uppercase', color: 'text.secondary' }}
                        >
                          {item.type}
                        </Typography>
                      </Box>
                    )}

                    {/* Three dots menu button */}
                    {!isMultiSelect && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardLongPress(item);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.3)',
                          color: '#ffffff',
                          p: 0.5,
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {/* Card Title & Size Info */}
                  <Box sx={{ p: 1.25 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      noWrap
                      sx={{ fontSize: '0.825rem', color: 'text.primary' }}
                    >
                      {item.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem' }}
                    >
                      {item.size} • {item.date}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Floating Multi-Select Action Toolbar */}
      {isMultiSelect && selectedIds.size > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: 480,
            borderRadius: '24px',
            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#0f172a',
            color: '#ffffff',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1200
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ ml: 1 }}>
            {selectedIds.size} Selected
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleBulkDelete}
              sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 700 }}
            >
              Delete
            </Button>
          </Box>
        </Paper>
      )}

      {/* Long-Press Action Sheet (Drawer) */}
      <Drawer
        anchor="bottom"
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            p: 2,
            maxHeight: '80vh'
          }
        }}
      >
        {actionFile && (
          <Box>
            <Box
              sx={{
                width: 40,
                height: 4,
                bgcolor: 'grey.300',
                borderRadius: 2,
                mx: 'auto',
                mb: 2
              }}
            />

            <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ mb: 0.5 }}>
              {actionFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              {actionFile.size} • {actionFile.type.toUpperCase()}
            </Typography>

            <Divider sx={{ mb: 1 }} />

            <List disablePadding>
              <ListItem button onClick={() => handleOpenFile(actionFile)}>
                <ListItemIcon>
                  <VisibilityIcon sx={{ color: '#2563eb' }} />
                </ListItemIcon>
                <ListItemText primary="Open / View Document" />
              </ListItem>

              <ListItem button onClick={handleActionSelectMode}>
                <ListItemIcon>
                  <SelectAllIcon sx={{ color: '#10b981' }} />
                </ListItemIcon>
                <ListItemText primary="Select File (Multi-select)" />
              </ListItem>

              {actionFile.type === 'pdf' && (
                <>
                  <ListItem button onClick={() => handleActionQuickTool('/pdf/compress-pdf')}>
                    <ListItemIcon>
                      <CompressIcon sx={{ color: '#8b5cf6' }} />
                    </ListItemIcon>
                    <ListItemText primary="Compress PDF" />
                  </ListItem>

                  <ListItem button onClick={() => handleActionQuickTool('/pdf/pdf-to-word')}>
                    <ListItemIcon>
                      <TransformIcon sx={{ color: '#3b82f6' }} />
                    </ListItemIcon>
                    <ListItemText primary="Convert PDF to Word" />
                  </ListItem>

                  <ListItem button onClick={() => handleActionQuickTool('/pdf/organize-pdf')}>
                    <ListItemIcon>
                      <RotateRightIcon sx={{ color: '#f59e0b' }} />
                    </ListItemIcon>
                    <ListItemText primary="Organize / Rotate Pages" />
                  </ListItem>
                </>
              )}

              <ListItem button onClick={handleActionShare}>
                <ListItemIcon>
                  <ShareIcon sx={{ color: '#06b6d4' }} />
                </ListItemIcon>
                <ListItemText primary="Share File" />
              </ListItem>

              <ListItem button onClick={handleActionRename}>
                <ListItemIcon>
                  <EditIcon sx={{ color: '#eab308' }} />
                </ListItemIcon>
                <ListItemText primary="Rename File" />
              </ListItem>

              <ListItem button onClick={handleActionDelete}>
                <ListItemIcon>
                  <DeleteOutlineIcon sx={{ color: '#ef4444' }} />
                </ListItemIcon>
                <ListItemText primary="Delete File" primaryTypographyProps={{ color: 'error' }} />
              </ListItem>
            </List>
          </Box>
        )}
      </Drawer>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle fontWeight={700}>Rename File</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveRename} sx={{ fontWeight: 700 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle fontWeight={700}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this document from your app gallery?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} sx={{ fontWeight: 700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Format Selection Modal for Non-PDF files */}
      <Dialog open={convertModalOpen} onClose={() => setConvertModalOpen(false)}>
        <DialogTitle fontWeight={700}>Convert Document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose a format to convert <strong>{actionFile?.name}</strong>:
          </Typography>
          <Button
            fullWidth
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => {
              setConvertModalOpen(false);
              handleActionQuickTool(
                actionFile?.type === 'docx' ? '/pdf/word-to-pdf' : '/pdf/jpg-to-pdf'
              );
            }}
            sx={{ mb: 1, textTransform: 'none', fontWeight: 700 }}
          >
            Convert to PDF
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* In-App File Viewer Modal */}
      <MobileFileViewerModal
        open={viewerOpen}
        file={selectedFileForViewer}
        onClose={() => {
          setViewerOpen(false);
          setSelectedFileForViewer(null);
        }}
      />
    </Box>
  );
};

export default MobileFilesTab;
