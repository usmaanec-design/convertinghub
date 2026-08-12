import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Alert,
  Grid,
  Card,
  IconButton,
  Checkbox,
  LinearProgress,
  Tooltip,
  Divider,
  Badge
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GridViewIcon from '@mui/icons-material/GridView';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DeselectIcon from '@mui/icons-material/Deselect';
import AddIcon from '@mui/icons-material/Add';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PageItem {
  id: string;
  originalIndex: number;
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270
  selected: boolean;
}

export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [originalPages, setOriginalPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drag and Drop state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setConvertedBlob(null);
    setError(null);
    setLoading(true);
    setPages([]);
    setOriginalPages([]);

    try {
      const arrayBuffer = await uploaded.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      const generatedPages: PageItem[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgressText(`Rendering page ${i} of ${numPages}...`);
        setProgressPercent(Math.round((i / numPages) * 100));

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          }).promise;

          const thumbnailUrl = canvas.toDataURL('image/png');
          const pageItem: PageItem = {
            id: `page-${i - 1}-${Date.now()}-${Math.random()}`,
            originalIndex: i - 1,
            thumbnailUrl,
            rotation: 0,
            selected: false
          };
          generatedPages.push(pageItem);
        }
      }

      setPages(generatedPages);
      setOriginalPages(generatedPages.map(p => ({ ...p })));
    } catch (err: any) {
      console.error('[Organize PDF] Error rendering thumbnails:', err);
      setError(`Failed to read PDF pages: ${err.message}`);
    } finally {
      setLoading(false);
      setProgressText('');
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const updatedPages = [...pages];
    const draggedPage = updatedPages.splice(dragItem.current, 1)[0];
    updatedPages.splice(dragOverItem.current, 0, draggedPage);

    dragItem.current = null;
    dragOverItem.current = null;

    setPages(updatedPages);
  };

  // Rotation & Deletion Handlers
  const handleRotate = (index: number, direction: 'cw' | 'ccw') => {
    setPages(prev => {
      const copy = [...prev];
      const current = copy[index].rotation || 0;
      const delta = direction === 'cw' ? 90 : -90;
      copy[index] = {
        ...copy[index],
        rotation: (current + delta + 360) % 360
      };
      return copy;
    });
  };

  const handleDelete = (index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleSelect = (index: number) => {
    setPages(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], selected: !copy[index].selected };
      return copy;
    });
  };

  // Toolbar Actions
  const handleSelectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const handleDeselectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const handleDeleteSelected = () => {
    setPages(prev => prev.filter(p => !p.selected));
  };

  const handleRotateSelected = (direction: 'cw' | 'ccw') => {
    setPages(prev => prev.map(p => {
      if (!p.selected) return p;
      const current = p.rotation || 0;
      const delta = direction === 'cw' ? 90 : -90;
      return { ...p, rotation: (current + delta + 360) % 360 };
    }));
  };

  const handleResetOrder = () => {
    setPages(originalPages.map(p => ({ ...p })));
  };

  // Final PDF Generation
  const handleOrganizePdf = async () => {
    if (!file || pages.length === 0) return;

    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();

      for (const item of pages) {
        const [copiedPage] = await newDoc.copyPages(srcDoc, [item.originalIndex]);

        if (item.rotation) {
          const existingAngle = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((existingAngle + item.rotation) % 360));
        }

        newDoc.addPage(copiedPage);
      }

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setConvertedBlob(blob);
    } catch (err: any) {
      console.error('[Organize PDF] Generation error:', err);
      setError(`Failed to save organized PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, '')}_organized.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedCount = pages.filter(p => p.selected).length;

  return (
    <Box sx={{ p: 3, maxWidth: 1250, mx: 'auto' }}>
      {/* Header */}
      <Stack spacing={1} alignItems="center" textAlign="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <GridViewIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h4" fontWeight="bold">
            Organize PDF
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Drag and drop page thumbnails to reorder pages, rotate, or delete pages visually.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Main Upload Box when no file uploaded */}
      {!file && !loading && (
        <Paper
          sx={{
            p: 6,
            maxWidth: 700,
            mx: 'auto',
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            bgcolor: 'action.hover',
            cursor: 'pointer',
            transition: '0.2s hover',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.selected' }
          }}
          component="label"
        >
          <input type="file" accept=".pdf" hidden onChange={handleFileUpload} />
          <UploadFileIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Select PDF File
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click to upload a PDF file and organize its pages
          </Typography>
        </Paper>
      )}

      {/* Thumbnail Loading State */}
      {loading && (
        <Paper sx={{ p: 5, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {progressText || 'Extracting PDF Pages...'}
          </Typography>
          <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 10, borderRadius: 5, my: 2 }} />
          <Typography variant="caption" color="text.secondary">
            Generating high-fidelity page thumbnails for drag & drop organizer...
          </Typography>
        </Paper>
      )}

      {/* Active PDF Page Organizer Workspace */}
      {file && pages.length > 0 && !loading && (
        <Stack spacing={3}>
          {/* Action Toolbar */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
              {/* File Info */}
              <Grid item xs={12} sm={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Badge badgeContent={pages.length} color="primary">
                    <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ maxWidth: 220 }}>
                      {file.name}
                    </Typography>
                  </Badge>
                  <Tooltip title="Upload another PDF">
                    <Button
                      variant="outlined"
                      size="small"
                      component="label"
                      startIcon={<AddIcon />}
                      sx={{ textTransform: 'none', ml: 1 }}
                    >
                      Change File
                      <input type="file" accept=".pdf" hidden onChange={handleFileUpload} />
                    </Button>
                  </Tooltip>
                </Stack>
              </Grid>

              {/* Control Actions */}
              <Grid item xs={12} sm={8}>
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SelectAllIcon />}
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DeselectIcon />}
                    onClick={handleDeselectAll}
                    disabled={selectedCount === 0}
                  >
                    Deselect
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteSelected}
                    disabled={selectedCount === 0}
                  >
                    Delete Selected ({selectedCount})
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RotateRightIcon />}
                    onClick={() => handleRotateSelected('cw')}
                    disabled={selectedCount === 0}
                  >
                    Rotate Right
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<RestartAltIcon />}
                    onClick={handleResetOrder}
                  >
                    Reset Order
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Grid Layout of PDF Pages */}
          <Grid container spacing={2.5}>
            {pages.map((page, index) => (
              <Grid
                item
                xs={6}
                sm={4}
                md={3}
                lg={2.4}
                key={page.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Card
                  elevation={page.selected ? 6 : 2}
                  sx={{
                    position: 'relative',
                    border: '2px solid',
                    borderColor: page.selected ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 1.5,
                    bgcolor: page.selected ? 'action.selected' : 'background.paper',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    cursor: 'grab',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    },
                    '&:active': {
                      cursor: 'grabbing',
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  {/* Top Card Bar: Selection Checkbox & Drag Handle & Quick Actions */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Checkbox
                      size="small"
                      checked={page.selected}
                      onChange={() => handleToggleSelect(index)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Tooltip title="Rotate Left 90°">
                        <IconButton size="small" onClick={() => handleRotate(index, 'ccw')}>
                          <RotateLeftIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rotate Right 90°">
                        <IconButton size="small" onClick={() => handleRotate(index, 'cw')}>
                          <RotateRightIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Page">
                        <IconButton size="small" color="error" onClick={() => handleDelete(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <DragHandleIcon color="action" fontSize="small" sx={{ ml: 0.5 }} />
                    </Stack>
                  </Stack>

                  {/* Thumbnail Image Render */}
                  <Box
                    sx={{
                      height: 190,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      overflow: 'hidden',
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <img
                      src={page.thumbnailUrl}
                      alt={`Page ${index + 1}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        transform: `rotate(${page.rotation}deg)`,
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </Box>

                  {/* Bottom Footer: Page Position Indicator */}
                  <Typography variant="subtitle2" fontWeight="bold" align="center" mt={1} color="text.primary">
                    Page {index + 1}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Bottom Sticky Action Bar */}
          <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.paper' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {pages.length} Pages Ready
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Final PDF will be compiled in the exact visual sequence shown above.
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} width={{ xs: '100%', sm: 'auto' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleResetOrder}
                >
                  Reset Sequence
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleOrganizePdf}
                  disabled={isProcessing || pages.length === 0}
                  sx={{ px: 4, fontWeight: 'bold' }}
                >
                  {isProcessing ? 'Generating PDF...' : 'Organize & Save PDF'}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Success Banner & Download Button */}
          {convertedBlob && (
            <Alert severity="success" sx={{ width: '100%', p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Organized PDF Generated Successfully!
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your PDF has been reordered according to the visual grid above.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download Organized PDF
                </Button>
              </Stack>
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );
}
