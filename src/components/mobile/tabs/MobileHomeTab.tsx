import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Grid,
  Button,
  useTheme,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  SwipeableDrawer,
  IconButton
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageAltIcon from '@mui/icons-material/Image';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CompressIcon from '@mui/icons-material/Compress';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import LockIcon from '@mui/icons-material/Lock';
import TableChartIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

// Set local PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface MobileHomeTabProps {
  onOpenScanner: () => void;
}

interface RecentFileItem {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'image' | 'audio' | 'video' | 'other';
  lastModified: string;
  fileObj?: File;
  thumbnailUrl?: string;
}

interface ConversionOption {
  label: string;
  path: string;
  icon: React.ReactNode;
  color: string;
}

export const MobileHomeTab: React.FC<MobileHomeTabProps> = ({
  onOpenScanner
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [deviceFiles, setDeviceFiles] = useState<RecentFileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<RecentFileItem | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);

  // Generate real PDF thumbnail canvas preview
  const generatePdfThumbnail = async (file: File): Promise<string | undefined> => {
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        return canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.warn('[PDF Thumbnail] Failed to render canvas thumbnail:', e);
    }
    return undefined;
  };

  const handleFilesPicked = async (files: FileList | File[]) => {
    const picked: RecentFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: RecentFileItem['type'] = 'other';
      if (['pdf'].includes(ext)) type = 'pdf';
      else if (['docx', 'doc', 'txt'].includes(ext)) type = 'docx';
      else if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext)) type = 'image';
      else if (['mp3', 'wav', 'aac'].includes(ext)) type = 'audio';
      else if (['mp4', 'mkv', 'avi'].includes(ext)) type = 'video';

      let thumbnailUrl: string | undefined = undefined;
      if (type === 'pdf') {
        thumbnailUrl = await generatePdfThumbnail(file);
      } else if (type === 'image') {
        thumbnailUrl = URL.createObjectURL(file);
      }

      picked.push({
        id: `${file.name}-${Date.now()}-${i}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type,
        lastModified: new Date(file.lastModified).toLocaleDateString(),
        fileObj: file,
        thumbnailUrl
      });
    }

    if (picked.length > 0) {
      setDeviceFiles((prev) => [...picked, ...prev]);
      // Open bottom sheet immediately for the first picked file
      setSelectedFile(picked[0]);
      setIsBottomSheetOpen(true);
    }
  };

  const getFileIcon = (type: RecentFileItem['type']) => {
    switch (type) {
      case 'pdf':
        return <PictureAsPdfIcon sx={{ color: '#ef4444' }} />;
      case 'docx':
        return <DescriptionIcon sx={{ color: '#3b82f6' }} />;
      case 'image':
        return <ImageAltIcon sx={{ color: '#10b981' }} />;
      case 'audio':
        return <AudioFileIcon sx={{ color: '#f59e0b' }} />;
      case 'video':
        return <VideoFileIcon sx={{ color: '#8b5cf6' }} />;
      default:
        return <InsertDriveFileIcon sx={{ color: '#94a3b8' }} />;
    }
  };

  // Valid registered conversion tool routes matching src/tools
  const quickActions = [
    {
      title: 'PDF to Word',
      path: '/pdf/pdf-to-word',
      icon: <PictureAsPdfIcon sx={{ fontSize: 28, color: '#ef4444' }} />
    },
    {
      title: 'Word to PDF',
      path: '/pdf/word-to-pdf',
      icon: <DescriptionIcon sx={{ fontSize: 28, color: '#3b82f6' }} />
    },
    {
      title: 'Image Converter',
      path: '/converters/image-converter',
      icon: <ImageAltIcon sx={{ fontSize: 28, color: '#10b981' }} />
    },
    {
      title: 'Doc Scanner',
      action: onOpenScanner,
      icon: <InsertDriveFileIcon sx={{ fontSize: 28, color: '#f59e0b' }} />
    }
  ];

  // Contextual Conversion Options per File Format
  const getConversionOptionsForFile = (file: RecentFileItem): ConversionOption[] => {
    switch (file.type) {
      case 'pdf':
        return [
          {
            label: 'Convert to Word (DOCX)',
            path: '/pdf/pdf-to-word',
            icon: <DescriptionIcon />,
            color: '#3b82f6'
          },
          {
            label: 'Convert to Excel (XLSX)',
            path: '/pdf/pdf-to-excel',
            icon: <TableChartIcon />,
            color: '#10b981'
          },
          {
            label: 'Convert to PowerPoint',
            path: '/pdf/pdf-to-ppt',
            icon: <SlideshowIcon />,
            color: '#f97316'
          },
          {
            label: 'Compress PDF File',
            path: '/pdf/compress-pdf',
            icon: <CompressIcon />,
            color: '#8b5cf6'
          },
          {
            label: 'Merge with other PDFs',
            path: '/pdf/merge-pdf',
            icon: <MergeTypeIcon />,
            color: '#ec4899'
          },
          {
            label: 'Protect / Lock PDF',
            path: '/pdf/protect-pdf',
            icon: <LockIcon />,
            color: '#eab308'
          }
        ];
      case 'docx':
        return [
          {
            label: 'Convert to PDF',
            path: '/pdf/word-to-pdf',
            icon: <PictureAsPdfIcon />,
            color: '#ef4444'
          }
        ];
      case 'image':
        return [
          {
            label: 'Convert Image to PDF',
            path: '/pdf/jpg-to-pdf',
            icon: <PictureAsPdfIcon />,
            color: '#ef4444'
          },
          {
            label: 'Image Format Converter',
            path: '/converters/image-converter',
            icon: <ImageAltIcon />,
            color: '#10b981'
          }
        ];
      case 'audio':
        return [
          {
            label: 'Audio Format Converter',
            path: '/converters/audio-converter',
            icon: <AudioFileIcon />,
            color: '#f59e0b'
          }
        ];
      case 'video':
        return [
          {
            label: 'Convert Video to GIF',
            path: '/converters/video-to-gif',
            icon: <VideoFileIcon />,
            color: '#8b5cf6'
          }
        ];
      default:
        return [
          {
            label: 'Convert Document',
            path: '/pdf/pdf-to-word',
            icon: <AutoAwesomeIcon />,
            color: '#2563eb'
          }
        ];
    }
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
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) handleFilesPicked(e.target.files);
        }}
      />

      {/* Prominent Instant File Selector Box */}
      <Paper
        elevation={0}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '20px',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 41, 59, 0.9) 100%)'
              : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: `2px dashed ${
            theme.palette.mode === 'dark' ? '#2563eb' : '#3b82f6'
          }`,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          transition: 'transform 0.2s ease',
          '&:active': { transform: 'scale(0.98)' }
        }}
      >
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: '16px',
            bgcolor: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
          }}
        >
          <AddCircleOutlineIcon sx={{ fontSize: 30 }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={800} color="text.primary">
          Select File to Convert
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          Tap to pick PDF, Word, Image, Audio, or Video from device
        </Typography>
      </Paper>

      {/* Horizontal Swipeable Recent Files Thumbnail Carousel */}
      {deviceFiles.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="text.secondary"
            sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            Recent Files
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              overflowX: 'auto',
              pb: 1,
              pt: 0.5,
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            {deviceFiles.map((file) => (
              <Card
                key={file.id}
                elevation={0}
                onClick={() => {
                  setSelectedFile(file);
                  setIsBottomSheetOpen(true);
                }}
                sx={{
                  flexShrink: 0,
                  width: 130,
                  borderRadius: '16px',
                  scrollSnapAlign: 'start',
                  bgcolor:
                    theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                  border: `1px solid ${
                    theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
                  }`,
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
              >
                {/* Thumbnail Display */}
                <Box
                  sx={{
                    height: 100,
                    bgcolor:
                      theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    getFileIcon(file.type)
                  )}
                  <Chip
                    label={file.type.toUpperCase()}
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      fontSize: '0.62rem',
                      height: 18,
                      fontWeight: 800,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: '#ffffff'
                    }}
                  />
                </Box>
                <Box sx={{ p: 1 }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    noWrap
                    display="block"
                  >
                    {file.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.68rem' }}
                  >
                    {file.size}
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Quick Converter Action Shortcuts Grid */}
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="text.secondary"
        sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}
      >
        Quick Actions
      </Typography>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {quickActions.map((item, index) => (
          <Grid item xs={6} key={index}>
            <Card
              elevation={0}
              sx={{
                borderRadius: '16px',
                bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                border: `1px solid ${
                  theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
                }`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:active': { transform: 'scale(0.97)' }
              }}
            >
              <CardActionArea
                onClick={() => {
                  if (item.path) navigate(item.path);
                  else if (item.action) item.action();
                }}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                {item.icon}
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ mt: 1, textAlign: 'center', fontSize: '0.85rem' }}
                >
                  {item.title}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Glassmorphic ConvertingHub Sleek Brand Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '24px',
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          border: `1px solid ${
            theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
          }`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Box
          component="img"
          src="/Logos/favicon-96x96.png"
          alt="ConvertingHub Logo"
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            objectFit: 'contain'
          }}
        />
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            ConvertingHub Engine
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Fast, secure & private client-first conversion tools
          </Typography>
        </Box>
      </Paper>

      {/* Contextual Conversion Format Bottom Sheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onOpen={() => setIsBottomSheetOpen(true)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
            px: 2.5,
            pt: 2,
            pb: 4,
            mb: '64px',
            maxHeight: 'calc(75vh - 64px)',
            overflowY: 'auto',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.25)'
          }
        }}
      >
        <Box sx={{ width: 40, height: 4, bgcolor: '#94a3b8', borderRadius: 2, mx: 'auto', mb: 2 }} />

        {selectedFile && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: '80%' }}>
                {getFileIcon(selectedFile.type)}
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} noWrap>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedFile.size}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setIsBottomSheetOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Choose Conversion Action
            </Typography>

            <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {getConversionOptionsForFile(selectedFile).map((option, idx) => (
                <ListItem
                  key={idx}
                  onClick={() => {
                    setIsBottomSheetOpen(false);
                    if (selectedFile && selectedFile.fileObj) {
                      (window as any).__pendingConversionFile = selectedFile.fileObj;
                    }
                    navigate(option.path);
                  }}
                  sx={{
                    borderRadius: '16px',
                    bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
                    border: `1px solid ${
                      theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
                    }`,
                    cursor: 'pointer',
                    py: 1.5,
                    px: 2,
                    '&:active': { bgcolor: '#2563eb15' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: option.color }}>
                    {option.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={700}>
                        {option.label}
                      </Typography>
                    }
                  />
                  <ArrowForwardIosIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </SwipeableDrawer>
    </Box>
  );
};

export default MobileHomeTab;
