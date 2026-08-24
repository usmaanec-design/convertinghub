import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  Typography,
  Stack,
  IconButton,
  Select,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';

export interface PdfSignatureModalProps {
  open: boolean;
  onClose: () => void;
  onApplySignature: (dataUrl: string) => void;
}

const SIGNATURE_FONTS = [
  { name: 'Brush Script / Cursive', value: 'cursive' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Georgia Italic', value: 'Georgia' },
  { name: 'Helvetica Bold', value: 'Helvetica' }
];

export default function PdfSignatureModal({
  open,
  onClose,
  onApplySignature
}: PdfSignatureModalProps) {
  const [tab, setTab] = useState<number>(0);
  const [typedName, setTypedName] = useState<string>('John Doe');
  const [typedFont, setTypedFont] = useState<string>('cursive');

  // Drawing Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  useEffect(() => {
    if (open && tab === 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [open, tab]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleApplyDraw = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onApplySignature(dataUrl);
      onClose();
    }
  };

  const handleApplyType = () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 450;
    tempCanvas.height = 140;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.font = `italic 46px ${typedFont}`;
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 225, 70);
      onApplySignature(tempCanvas.toDataURL('image/png'));
      onClose();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onApplySignature(event.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle display="flex" justifyContent="space-between" alignItems="center" sx={{ borderBottom: '1px solid #e2e8f0' }}>
        <Typography component="span" variant="h6" fontWeight="800" color="#0f172a">
          Create & Add Signature
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
        <Tabs value={tab} onChange={(_, val) => setTab(val)} centered>
          <Tab icon={<EditIcon />} label="Draw" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab icon={<TextFieldsIcon />} label="Type" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab icon={<UploadIcon />} label="Upload" iconPosition="start" sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3, textAlign: 'center' }}>
        {/* TAB 0: Draw */}
        {tab === 0 && (
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                border: '2px dashed #cbd5e1',
                borderRadius: 3,
                bgcolor: '#ffffff',
                cursor: 'crosshair',
                touchAction: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <canvas
                ref={canvasRef}
                width={450}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </Box>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={clearCanvas}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Clear Canvas
            </Button>
          </Stack>
        )}

        {/* TAB 1: Type */}
        {tab === 1 && (
          <Stack spacing={2.5} alignItems="center">
            <TextField
              fullWidth
              size="small"
              label="Type Your Name"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
            />
            <Select
              fullWidth
              size="small"
              value={typedFont}
              onChange={(e) => setTypedFont(e.target.value)}
            >
              {SIGNATURE_FONTS.map((font) => (
                <MenuItem key={font.value} value={font.value}>
                  {font.name}
                </MenuItem>
              ))}
            </Select>
            <Box
              sx={{
                width: '100%',
                p: 3,
                border: '1px solid #e2e8f0',
                borderRadius: 3,
                bgcolor: '#ffffff',
                minHeight: 110,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <Typography sx={{ fontFamily: typedFont, fontSize: 40, fontStyle: 'italic', color: '#0f172a' }}>
                {typedName || 'Your Signature'}
              </Typography>
            </Box>
          </Stack>
        )}

        {/* TAB 2: Upload */}
        {tab === 2 && (
          <Box
            sx={{
              border: '2px dashed #cbd5e1',
              borderRadius: 3,
              p: 4,
              cursor: 'pointer',
              bgcolor: '#ffffff',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#2563eb' }
            }}
            component="label"
          >
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
            <UploadIcon sx={{ fontSize: 48, color: '#2563eb', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold" color="#0f172a">
              Click to select or drop a signature image file
            </Typography>
            <Typography variant="caption" color="text.secondary">
              PNG or JPG images with transparent background recommended
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        {tab === 0 && (
          <Button variant="contained" onClick={handleApplyDraw} sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}>
            Apply Signature
          </Button>
        )}
        {tab === 1 && (
          <Button variant="contained" onClick={handleApplyType} sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}>
            Apply Signature
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
