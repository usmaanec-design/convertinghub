import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  useTheme
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageAltIcon from '@mui/icons-material/Image';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StorageIcon from '@mui/icons-material/Storage';
import MobileFileViewerModal, { FileToView } from '../MobileFileViewerModal';

export const MobileFilesTab: React.FC = () => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [filesList, setFilesList] = useState<
    Array<{
      id: string;
      name: string;
      size: string;
      type: 'pdf' | 'docx' | 'image' | 'archive' | 'other';
      date: string;
      fileObj?: File;
    }>
  >([]);

  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [selectedFileForViewer, setSelectedFileForViewer] = useState<FileToView | null>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <PictureAsPdfIcon sx={{ color: '#ef4444' }} />;
      case 'docx':
        return <DescriptionIcon sx={{ color: '#3b82f6' }} />;
      case 'image':
        return <ImageAltIcon sx={{ color: '#10b981' }} />;
      case 'archive':
        return <FolderZipIcon sx={{ color: '#f59e0b' }} />;
      default:
        return <InsertDriveFileIcon sx={{ color: '#94a3b8' }} />;
    }
  };

  const handleDeviceFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked: typeof filesList = [];
    const files = Array.from(e.target.files);

    files.forEach((file, i) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: 'pdf' | 'docx' | 'image' | 'archive' | 'other' = 'other';
      if (['pdf'].includes(ext)) type = 'pdf';
      else if (['docx', 'doc', 'txt'].includes(ext)) type = 'docx';
      else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) type = 'image';
      else if (['zip', 'rar', '7z'].includes(ext)) type = 'archive';

      picked.push({
        id: `${file.name}-${Date.now()}-${i}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type,
        date: new Date(file.lastModified).toLocaleDateString(),
        fileObj: file
      });
    });

    setFilesList((prev) => [...picked, ...prev]);
  };

  const handleOpenFile = (item: (typeof filesList)[0]) => {
    setSelectedFileForViewer({
      name: item.name,
      fileObj: item.fileObj,
      type: item.type === 'pdf' ? 'pdf' : item.type === 'image' ? 'image' : 'other',
      size: item.size
    });
    setViewerOpen(true);
  };

  const handleDeleteFile = (id: string) => {
    setFilesList((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <Box
      sx={{
        px: 2,
        pt: 2,
        pb: 10,
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

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Typography variant="h6" fontWeight={800} color="text.primary">
          My Files ({filesList.length})
        </Typography>

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
      </Box>

      {/* Device Storage Button */}
      <Paper
        elevation={0}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: '16px',
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
          border: `1px solid ${
            theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
          }`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'transform 0.2s ease',
          '&:active': { transform: 'scale(0.98)' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StorageIcon sx={{ color: '#2563eb', fontSize: 28 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Device Storage
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Browse Downloads, Documents & Phone Storage
            </Typography>
          </Box>
        </Box>
        <Chip label="Browse" size="small" color="primary" sx={{ fontWeight: 700 }} />
      </Paper>

      {/* Files List */}
      {filesList.length === 0 ? (
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
            No Files Selected Yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, maxWidth: 260, mx: 'auto' }}
          >
            Tap "Add Files" or "Device Storage" to select documents from your phone.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}
          >
            Open Phone File Manager
          </Button>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '20px',
            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            border: `1px solid ${
              theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
            }`,
            overflow: 'hidden'
          }}
        >
          <List disablePadding>
            {filesList.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderBottom: `1px solid ${
                    theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9'
                  }`
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getFileIcon(item.type)}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      noWrap
                      onClick={() => handleOpenFile(item)}
                      sx={{ cursor: 'pointer', '&:hover': { color: '#2563eb' } }}
                    >
                      {item.name}
                    </Typography>
                  }
                  secondary={`${item.size} • ${item.date}`}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton size="small" onClick={() => handleOpenFile(item)}>
                    <VisibilityIcon fontSize="small" sx={{ color: '#38bdf8' }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteFile(item.id)}>
                    <DeleteOutlineIcon fontSize="small" sx={{ color: '#ef4444' }} />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

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
