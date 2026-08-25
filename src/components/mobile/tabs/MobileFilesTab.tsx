import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Grid,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  InputAdornment,
  LinearProgress
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
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import CompressIcon from '@mui/icons-material/Compress';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import MergeIcon from '@mui/icons-material/Merge';
import PrintIcon from '@mui/icons-material/Print';
import FolderIcon from '@mui/icons-material/Folder';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';

import { useNavigate } from 'react-router-dom';

import MobileFileViewerModal, { FileToView } from '../MobileFileViewerModal';
import PdfGridThumbnail from '../PdfGridThumbnail';
import {
  saveDocumentToIDB,
  getAllDocumentsFromIDB,
  deleteDocumentFromIDB,
  saveAuthorizedFolderToIDB,
  getAuthorizedFoldersFromIDB,
  removeAuthorizedFolderFromIDB,
  scanAndReconcileAuthorizedFolders,
  detectFileType,
  formatSizeBytes,
  StoredDocument,
  SupportedFileType,
  AuthorizedFolderRecord
} from '../../../utils/fileStore';
import {
  getCompatibleActions,
  ActionDefinition
} from '../../../utils/compatibilityEngine';

export interface SavedFileItem {
  id: string;
  name: string;
  size: string;
  sizeBytes?: number;
  type: SupportedFileType;
  date: string;
  lastModified?: number;
  folderId?: string;
  relativePath?: string;
  fileObj?: File | Blob;
  previewUrl?: string;
}

export const MobileFilesTab: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Files & Authorized Folders State
  const [filesList, setFilesList] = useState<SavedFileItem[]>([]);
  const [authorizedFolders, setAuthorizedFolders] = useState<AuthorizedFolderRecord[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState<boolean>(false);

  // Layout View Mode (Grid vs List)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Multi-select State
  const [isMultiSelect, setIsMultiSelect] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action Sheet Drawer State
  const [actionSheetOpen, setActionSheetOpen] = useState<boolean>(false);
  const [targetFile, setTargetFile] = useState<SavedFileItem | null>(null);

  // Viewer Modal State
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [selectedFileForViewer, setSelectedFileForViewer] = useState<FileToView | null>(null);

  // Rename Dialog State
  const [renameDialogOpen, setRenameDialogOpen] = useState<boolean>(false);
  const [renameInput, setRenameInput] = useState<string>('');

  // 1. Initial Load & Startup Automatic Reconciliation
  useEffect(() => {
    let isMounted = true;
    async function initLibrary() {
      try {
        const folders = await getAuthorizedFoldersFromIDB();
        if (isMounted) setAuthorizedFolders(folders);

        if (folders.length === 0 && localStorage.getItem('saf_folder_setup_done') !== 'true') {
          if (isMounted) setPermissionModalOpen(true);
        }

        // Load existing docs first
        const storedDocs = await getAllDocumentsFromIDB();
        if (isMounted) {
          mapStoredDocsToState(storedDocs);
        }

        // If authorized folders exist, perform automatic reconciliation scan
        if (folders.length > 0) {
          if (isMounted) setIsScanning(true);
          const updatedDocs = await scanAndReconcileAuthorizedFolders(folders);
          if (isMounted) mapStoredDocsToState(updatedDocs);
        }
      } catch (err) {
        console.warn('[MobileFilesTab] Initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoadingDB(false);
          setIsScanning(false);
        }
      }
    }

    initLibrary();
    return () => {
      isMounted = false;
    };
  }, []);

  const mapStoredDocsToState = (storedDocs: StoredDocument[]) => {
    const items: SavedFileItem[] = storedDocs.map((doc: StoredDocument) => {
      const fileObj = doc.blob ? new File([doc.blob], doc.name, { type: doc.blob.type }) : undefined;
      let previewUrl: string | undefined = undefined;
      if (doc.type === 'image' && doc.blob) {
        previewUrl = URL.createObjectURL(doc.blob);
      }
      return {
        id: doc.id,
        name: doc.name,
        size: doc.size || (doc.blob ? formatSizeBytes(doc.blob.size) : '0 B'),
        sizeBytes: doc.blob?.size || 0,
        type: doc.type,
        date: doc.date || new Date().toLocaleDateString(),
        folderId: doc.folderId,
        relativePath: doc.relativePath,
        fileObj,
        previewUrl
      };
    });
    setFilesList(items);
  };

  // 2. Authorize New Document Folder via SAF / File System Access API
  const handleAuthorizeFolder = async () => {
    setPermissionModalOpen(false);
    localStorage.setItem('saf_folder_setup_done', 'true');
    setIsScanning(true);

    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        const folderRecord: AuthorizedFolderRecord = {
          id: `${dirHandle.name}-${Date.now()}`,
          name: dirHandle.name,
          addedAt: Date.now(),
          handle: dirHandle
        };

        await saveAuthorizedFolderToIDB(folderRecord);
        const updatedFolders = [...authorizedFolders, folderRecord];
        setAuthorizedFolders(updatedFolders);

        // Perform recursive scan on newly authorized folder
        const updatedDocs = await scanAndReconcileAuthorizedFolders(updatedFolders);
        mapStoredDocsToState(updatedDocs);
      } else {
        // Fallback: prompt file picker
        fileInputRef.current?.click();
      }
    } catch (err) {
      console.warn('[MobileFilesTab] Folder authorization skipped/failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Remove Authorized Folder
  const handleRemoveFolder = async (folderId: string) => {
    await removeAuthorizedFolderFromIDB(folderId);
    const updatedFolders = authorizedFolders.filter((f) => f.id !== folderId);
    setAuthorizedFolders(updatedFolders);

    setIsScanning(true);
    const updatedDocs = await scanAndReconcileAuthorizedFolders(updatedFolders);
    mapStoredDocsToState(updatedDocs);
    setIsScanning(false);
  };

  // Add individual picked files from device
  const handleDeviceFilesPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newItems: SavedFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = detectFileType(file.name);
      const id = `manual:${file.name}-${Date.now()}-${i}`;
      const sizeStr = formatSizeBytes(file.size);
      const dateStr = new Date(file.lastModified || Date.now()).toLocaleDateString();

      try {
        await saveDocumentToIDB({
          id,
          name: file.name,
          size: sizeStr,
          sizeBytes: file.size,
          type,
          date: dateStr,
          lastModified: file.lastModified,
          blob: file
        });
      } catch (err) {
        console.warn('Could not save to IndexedDB:', err);
      }

      let previewUrl: string | undefined = undefined;
      if (type === 'image') {
        previewUrl = URL.createObjectURL(file);
      }

      newItems.push({
        id,
        name: file.name,
        size: sizeStr,
        sizeBytes: file.size,
        type,
        date: dateStr,
        lastModified: file.lastModified,
        fileObj: file,
        previewUrl
      });
    }

    setFilesList((prev) => [...newItems, ...prev]);
  };

  // Filter and Search processing
  const filteredFiles = useMemo(() => {
    return filesList.filter((item) => {
      if (activeFilter === 'PDF' && item.type !== 'pdf') return false;
      if (activeFilter === 'Word' && item.type !== 'docx') return false;
      if (activeFilter === 'Excel' && item.type !== 'xlsx') return false;
      if (activeFilter === 'PPT' && item.type !== 'pptx') return false;
      if (activeFilter === 'Images' && item.type !== 'image') return false;
      if (activeFilter === 'Text' && item.type !== 'txt') return false;
      if (activeFilter === 'Large Files' && (item.sizeBytes || 0) < 5 * 1024 * 1024) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          (item.relativePath && item.relativePath.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [filesList, activeFilter, searchQuery]);

  // Compatible Actions for current selection
  const currentSelectionItems = useMemo(() => {
    if (isMultiSelect) {
      return filesList.filter((f) => selectedIds.has(f.id));
    }
    return targetFile ? [targetFile] : [];
  }, [isMultiSelect, selectedIds, targetFile, filesList]);

  const compatibleActions = useMemo(() => {
    return getCompatibleActions(
      currentSelectionItems.map((f) => ({ id: f.id, type: f.type, name: f.name }))
    );
  }, [currentSelectionItems]);

  // Handlers
  const handleOpenFile = (item: SavedFileItem) => {
    if (isMultiSelect) {
      toggleSelectFile(item.id);
      return;
    }

    if (!item.fileObj) {
      fileInputRef.current?.click();
      return;
    }

    if (item.type === 'pdf') {
      setSelectedFileForViewer({
        name: item.name,
        fileObj: item.fileObj as File,
        type: 'pdf',
        size: item.size
      });
      setViewerOpen(true);
    } else if (item.type === 'image') {
      setSelectedFileForViewer({
        name: item.name,
        fileObj: item.fileObj as File,
        url: item.previewUrl,
        type: 'image',
        size: item.size
      });
      setViewerOpen(true);
    } else {
      setTargetFile(item);
      setActionSheetOpen(true);
    }
  };

  const toggleSelectFile = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleActionExecute = (action: ActionDefinition) => {
    setActionSheetOpen(false);

    if (action.handlerType === 'navigate_tool' && action.toolPath) {
      if (currentSelectionItems.length === 1 && currentSelectionItems[0].fileObj) {
        (window as any).__pendingConversionFile = currentSelectionItems[0].fileObj;
      } else if (currentSelectionItems.length > 1) {
        (window as any).__pendingConversionFiles = currentSelectionItems
          .map((f) => f.fileObj)
          .filter(Boolean);
      }
      navigate(action.toolPath);
    } else if (action.handlerType === 'view_file' && currentSelectionItems[0]) {
      handleOpenFile(currentSelectionItems[0]);
    } else if (action.handlerType === 'share' && currentSelectionItems[0]?.fileObj) {
      if (navigator.share) {
        navigator
          .share({
            files: [currentSelectionItems[0].fileObj as File],
            title: currentSelectionItems[0].name
          })
          .catch(() => {});
      }
    } else if (action.handlerType === 'print') {
      window.print();
    }
  };

  const handleBulkDelete = async () => {
    for (const id of Array.from(selectedIds)) {
      await deleteDocumentFromIDB(id);
    }
    setFilesList((prev) => prev.filter((f) => !selectedIds.has(f.id)));
    setSelectedIds(new Set());
    setIsMultiSelect(false);
  };

  const saveRename = async () => {
    if (!targetFile || !renameInput.trim()) return;
    const updatedName = renameInput.trim();

    setFilesList((prev) =>
      prev.map((f) => (f.id === targetFile.id ? { ...f, name: updatedName } : f))
    );

    if (targetFile.fileObj) {
      await saveDocumentToIDB({
        id: targetFile.id,
        name: updatedName,
        size: targetFile.size,
        type: targetFile.type,
        date: targetFile.date,
        blob: targetFile.fileObj
      });
    }

    setRenameDialogOpen(false);
    setTargetFile(null);
  };

  const getTypeIcon = (type: SupportedFileType) => {
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

  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'EditNote':
        return <EditNoteIcon sx={{ color: '#2563eb' }} />;
      case 'Description':
        return <DescriptionIcon sx={{ color: '#3b82f6' }} />;
      case 'TableChart':
        return <TableChartIcon sx={{ color: '#10b981' }} />;
      case 'Slideshow':
        return <SlideshowIcon sx={{ color: '#f97316' }} />;
      case 'Compress':
        return <CompressIcon sx={{ color: '#8b5cf6' }} />;
      case 'CallSplit':
        return <CallSplitIcon sx={{ color: '#ec4899' }} />;
      case 'RotateRight':
        return <RotateRightIcon sx={{ color: '#f59e0b' }} />;
      case 'Merge':
        return <MergeIcon sx={{ color: '#2563eb' }} />;
      case 'PictureAsPdf':
        return <PictureAsPdfIcon sx={{ color: '#ef4444' }} />;
      case 'Share':
        return <ShareIcon sx={{ color: '#06b6d4' }} />;
      case 'Print':
        return <PrintIcon sx={{ color: '#6366f1' }} />;
      default:
        return <VisibilityIcon sx={{ color: '#2563eb' }} />;
    }
  };

  return (
    <Box
      sx={{
        px: 2,
        pt: 2,
        pb: 12,
        width: '100%',
        maxWidth: 680,
        mx: 'auto'
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        multiple
        style={{ display: 'none' }}
        onChange={handleDeviceFilesPicked}
      />

      {/* Asynchronous Scan Progress Bar */}
      {isScanning && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" fontWeight={700} color="#2563eb">
              Indexing authorized document folders...
            </Typography>
          </Box>
          <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
        </Box>
      )}

      {/* Header Controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5
        }}
      >
        <Typography variant="h6" fontWeight={800} color="text.primary">
          {isMultiSelect ? `${selectedIds.size} Selected` : `Files Library (${filesList.length})`}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9' }}
          >
            {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
          </IconButton>

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
              onClick={handleAuthorizeFolder}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              Add Folder
            </Button>
          )}
        </Box>
      </Box>

      {/* Authorized Folders Bar */}
      {authorizedFolders.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            AUTHORIZED DOCUMENT FOLDERS ({authorizedFolders.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {authorizedFolders.map((f) => (
              <Chip
                key={f.id}
                icon={<FolderIcon sx={{ color: '#2563eb' }} />}
                label={f.name}
                onDelete={() => handleRemoveFolder(f.id)}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#eff6ff',
                  border: '1px solid #bfdbfe'
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Fast Search Input */}
      <Box sx={{ mb: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by filename, folder or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'
            }
          }}
        />
      </Box>

      {/* Filter Chips Bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 1.5,
          mb: 1.5,
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {['All', 'PDF', 'Word', 'Excel', 'PPT', 'Images', 'Text', 'Large Files'].map((filter) => (
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

      {/* Multi-Select Bar Controls */}
      {isMultiSelect && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            p: 1.25,
            borderRadius: '12px',
            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#eff6ff'
          }}
        >
          <Button
            size="small"
            startIcon={<SelectAllIcon />}
            onClick={handleSelectAll}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {selectedIds.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            {selectedIds.size} files selected
          </Typography>
        </Box>
      )}

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
          <FolderSpecialIcon
            sx={{ fontSize: 48, color: '#94a3b8', mb: 1, opacity: 0.6 }}
          />
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            No Documents Authorized Yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, maxWidth: 340, mx: 'auto' }}
          >
            Tap "Choose Document Folder" to authorize a folder (e.g. Download or Documents). ConvertingHub will automatically index all supported PDFs, Word, Excel, PowerPoint, Text and images inside it.
          </Typography>
          <Button
            variant="contained"
            onClick={handleAuthorizeFolder}
            startIcon={<StorageIcon />}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb' }}
          >
            Choose Document Folder
          </Button>
        </Paper>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
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
                    setTargetFile(item);
                    setActionSheetOpen(true);
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
                  {isMultiSelect && (
                    <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 10 }}>
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

                  <Box
                    sx={{
                      height: 120,
                      width: '100%',
                      bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {item.type === 'pdf' && item.fileObj ? (
                      <PdfGridThumbnail fileObj={item.fileObj as File} />
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

                    {!isMultiSelect && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetFile(item);
                          setActionSheetOpen(true);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.3)',
                          color: '#ffffff',
                          p: 0.5
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

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
      ) : (
        /* LIST VIEW */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredFiles.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <Paper
                key={item.id}
                elevation={0}
                onClick={() => handleOpenFile(item)}
                sx={{
                  p: 1.5,
                  borderRadius: '16px',
                  bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                  border: `2px solid ${
                    isSelected
                      ? '#2563eb'
                      : theme.palette.mode === 'dark'
                      ? '#334155'
                      : '#e2e8f0'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer'
                }}
              >
                {isMultiSelect && (
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelectFile(item.id)}
                    sx={{ p: 0 }}
                  />
                )}
                {getTypeIcon(item.type)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap color="text.primary">
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.size} • {item.date} {item.relativePath ? `• ${item.relativePath}` : ''}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetFile(item);
                    setActionSheetOpen(true);
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Floating Multi-Select Toolbar */}
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
              onClick={() => setActionSheetOpen(true)}
              sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb' }}
            >
              Smart Actions
            </Button>
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

      {/* Dynamic Compatibility Smart Action Sheet */}
      <Drawer
        anchor="bottom"
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            p: 2,
            maxHeight: '80vh',
            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'
          }
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: 'grey.400',
            borderRadius: 2,
            mx: 'auto',
            mb: 2
          }}
        />

        <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ mb: 0.5 }}>
          {isMultiSelect ? `${selectedIds.size} Files Selected` : targetFile?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          COMPATIBLE ACTIONS ({compatibleActions.length})
        </Typography>

        <Divider sx={{ mb: 1 }} />

        <List disablePadding>
          {compatibleActions.map((action) => (
            <ListItem button key={action.id} onClick={() => handleActionExecute(action)}>
              <ListItemIcon>{getActionIcon(action.iconName)}</ListItemIcon>
              <ListItemText primary={action.label} />
            </ListItem>
          ))}

          {!isMultiSelect && (
            <ListItem
              button
              onClick={() => {
                setActionSheetOpen(false);
                setIsMultiSelect(true);
                if (targetFile) setSelectedIds(new Set([targetFile.id]));
              }}
            >
              <ListItemIcon>
                <SelectAllIcon sx={{ color: '#10b981' }} />
              </ListItemIcon>
              <ListItemText primary="Multi-Select Mode" />
            </ListItem>
          )}

          {!isMultiSelect && targetFile && (
            <ListItem
              button
              onClick={() => {
                setActionSheetOpen(false);
                setRenameInput(targetFile.name);
                setRenameDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <EditIcon sx={{ color: '#eab308' }} />
              </ListItemIcon>
              <ListItemText primary="Rename File" />
            </ListItem>
          )}

          {!isMultiSelect && targetFile && (
            <ListItem
              button
              onClick={async () => {
                setActionSheetOpen(false);
                await deleteDocumentFromIDB(targetFile.id);
                setFilesList((prev) => prev.filter((f) => f.id !== targetFile.id));
              }}
            >
              <ListItemIcon>
                <DeleteOutlineIcon sx={{ color: '#ef4444' }} />
              </ListItemIcon>
              <ListItemText primary="Delete File" />
            </ListItem>
          )}
        </List>
      </Drawer>

      {/* Persistent SAF Document Folder Setup Dialog */}
      <Dialog
        open={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        PaperProps={{
          sx: { borderRadius: '24px', p: 1, maxWidth: 440 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <FolderSpecialIcon sx={{ color: '#2563eb', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={800}>
            Access Your Documents
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
            Choose a folder where your documents are stored (such as <strong>Download</strong> or <strong>Documents</strong>).
            <br /><br />
            ConvertingHub will automatically index all supported PDFs, Word, Excel, PowerPoint, text files and images inside the folder you authorize, including subfolders.
            <br /><br />
            <strong>Privacy Guarantee:</strong> Your files remain stored locally on your device unless you explicitly choose a conversion or upload operation.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="text"
            onClick={() => setPermissionModalOpen(false)}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Skip
          </Button>
          <Button
            variant="contained"
            onClick={handleAuthorizeFolder}
            startIcon={<FolderIcon />}
            sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb' }}
          >
            Choose Document Folder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename File Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveRename} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* In-App File Viewer Modal */}
      <MobileFileViewerModal
        open={viewerOpen}
        file={selectedFileForViewer}
        onClose={() => setViewerOpen(false)}
      />
    </Box>
  );
};

export default MobileFilesTab;
