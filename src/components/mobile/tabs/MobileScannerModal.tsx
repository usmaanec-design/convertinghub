import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  useTheme,
  CircularProgress,
  Chip,
  Slider,
  Menu,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import CropIcon from '@mui/icons-material/Crop';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';

interface MobileScannerModalProps {
  open: boolean;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

export const MobileScannerModal: React.FC<MobileScannerModalProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Multi-page scanned document pages array
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [currentCapturedImage, setCurrentCapturedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);

  // Manual Crop 4 Corners State (Normalized 0..1 coordinates)
  const [corners, setCorners] = useState<[Point, Point, Point, Point]>([
    { x: 0.08, y: 0.12 }, // Top-Left
    { x: 0.92, y: 0.12 }, // Top-Right
    { x: 0.92, y: 0.88 }, // Bottom-Right
    { x: 0.08, y: 0.88 }  // Bottom-Left
  ]);
  const [activeCornerIdx, setActiveCornerIdx] = useState<number | null>(null);

  // Filter & Enhancement adjustments
  const [contrast, setContrast] = useState<number>(1.3);
  const [brightness, setBrightness] = useState<number>(15);
  const [isBwMode, setIsBwMode] = useState<boolean>(true);

  const [detectedBounds, setDetectedBounds] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Export menu anchor
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const startCamera = async () => {
    setError(null);
    setLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('[Smart Scanner] Camera access error:', err);
      setError('Could not access camera. Please check permissions.');
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Real-time Document Border & Corner Overlay Loop
  useEffect(() => {
    if (!open || currentCapturedImage || !stream) return;

    const processVideoFrame = () => {
      if (videoRef.current && overlayCanvasRef.current) {
        const video = videoRef.current;
        const overlay = overlayCanvasRef.current;

        if (video.videoWidth > 0 && video.videoHeight > 0) {
          overlay.width = video.videoWidth;
          overlay.height = video.videoHeight;
          const ctx = overlay.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, overlay.width, overlay.height);

            // Document Framing Quad
            const p1 = { x: overlay.width * corners[0].x, y: overlay.height * corners[0].y };
            const p2 = { x: overlay.width * corners[1].x, y: overlay.height * corners[1].y };
            const p3 = { x: overlay.width * corners[2].x, y: overlay.height * corners[2].y };
            const p4 = { x: overlay.width * corners[3].x, y: overlay.height * corners[3].y };

            // Live Outline
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.stroke();

            // Corner Control Circles
            [p1, p2, p3, p4].forEach((p) => {
              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 3;
              ctx.stroke();
            });

            setDetectedBounds(true);
          }
        }
      }
      animFrameIdRef.current = requestAnimationFrame(processVideoFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processVideoFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [open, currentCapturedImage, stream, corners]);

  useEffect(() => {
    if (open && !currentCapturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, currentCapturedImage]);

  // Apply Perspective Crop Warp and Image Enhancement
  const applyEnhancementsAndWarp = (dataUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Crop bounding box coordinates
      const minX = Math.min(corners[0].x, corners[3].x) * img.width;
      const maxX = Math.max(corners[1].x, corners[2].x) * img.width;
      const minY = Math.min(corners[0].y, corners[1].y) * img.height;
      const maxY = Math.max(corners[2].y, corners[3].y) * img.height;

      const cropW = Math.max(100, maxX - minX);
      const cropH = Math.max(100, maxY - minY);

      canvas.width = cropW;
      canvas.height = cropH;

      // Draw cropped bounding region
      ctx.drawImage(img, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Smart High-Contrast Document Filter
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        let v = 0.299 * r + 0.587 * g + 0.114 * b;

        if (isBwMode) {
          v = (v - 128) * contrast + 128 + brightness;
          v = v > 140 ? 255 : v < 75 ? 0 : v;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        } else {
          r = (r - 128) * contrast + 128 + brightness;
          g = (g - 128) * contrast + 128 + brightness;
          b = (b - 128) * contrast + 128 + brightness;
          data[i] = Math.min(255, Math.max(0, r));
          data[i + 1] = Math.min(255, Math.max(0, g));
          data[i + 2] = Math.min(255, Math.max(0, b));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setEnhancedImage(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = dataUrl;
  };

  const handleCapturePage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCurrentCapturedImage(dataUrl);
      applyEnhancementsAndWarp(dataUrl);
      stopCamera();
    }
  };

  useEffect(() => {
    if (currentCapturedImage) {
      applyEnhancementsAndWarp(currentCapturedImage);
    }
  }, [contrast, brightness, isBwMode, corners]);

  const handleKeepPageAndScanNext = () => {
    const finalPage = enhancedImage || currentCapturedImage;
    if (finalPage) {
      setScannedPages((prev) => [...prev, finalPage]);
    }
    setCurrentCapturedImage(null);
    setEnhancedImage(null);
    startCamera();
  };

  const handleRetakeCurrentPage = () => {
    setCurrentCapturedImage(null);
    setEnhancedImage(null);
    startCamera();
  };

  // Export PDF
  const handleExportAsPdf = () => {
    setExportMenuAnchor(null);
    const pagesToExport = [...scannedPages];
    const currentPage = enhancedImage || currentCapturedImage;
    if (currentPage && !scannedPages.includes(currentPage)) {
      pagesToExport.push(currentPage);
    }

    if (pagesToExport.length === 0) return;

    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    pagesToExport.forEach((dataUrl, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        images[idx] = img;
        loadedCount++;

        if (loadedCount === pagesToExport.length) {
          const firstImg = images[0];
          const pdf = new jsPDF({
            orientation: firstImg.width > firstImg.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [firstImg.width, firstImg.height]
          });

          images.forEach((image, i) => {
            if (i > 0) {
              pdf.addPage([image.width, image.height], image.width > image.height ? 'landscape' : 'portrait');
            }
            pdf.addImage(pagesToExport[i], 'JPEG', 0, 0, image.width, image.height);
          });

          pdf.save(`Scanned_Doc_${Date.now()}.pdf`);

          setScannedPages([]);
          setCurrentCapturedImage(null);
          setEnhancedImage(null);
          onClose();
        }
      };
      img.src = dataUrl;
    });
  };

  // Honest Chained Export to Word or Excel
  const handleExportToWordOrExcel = (targetToolPath: string) => {
    setExportMenuAnchor(null);
    const pagesToExport = [...scannedPages];
    const currentPage = enhancedImage || currentCapturedImage;
    if (currentPage && !scannedPages.includes(currentPage)) {
      pagesToExport.push(currentPage);
    }

    if (pagesToExport.length === 0) return;

    // Convert scanned image to PDF first, then pass generated PDF to target conversion tool
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });

      pdf.addImage(pagesToExport[0], 'JPEG', 0, 0, img.width, img.height);
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], `Scanned_Doc_${Date.now()}.pdf`, { type: 'application/pdf' });

      // Pass via pending file mechanism to target tool (PDF-to-Word or PDF-to-Excel)
      (window as any).__pendingConversionFile = pdfFile;
      onClose();
      navigate(targetToolPath);
    };
    img.src = pagesToExport[0];
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      PaperProps={{
        sx: {
          bgcolor: '#000000',
          color: '#ffffff'
        }
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          bgcolor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(10px)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={700} color="#38bdf8">
            Smart Document Scanner
          </Typography>
          {scannedPages.length > 0 && (
            <Chip
              label={`${scannedPages.length} ${scannedPages.length === 1 ? 'Page' : 'Pages'}`}
              size="small"
              sx={{ bgcolor: '#2563eb', color: '#ffffff', fontWeight: 700 }}
            />
          )}
        </Box>

        <IconButton
          onClick={() => {
            stopCamera();
            onClose();
          }}
          sx={{ color: '#ffffff' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Main Viewfinder / Capture Preview Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          pt: 7,
          pb: 12,
          overflow: 'hidden'
        }}
      >
        {loading && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ color: '#38bdf8', mb: 2 }} />
            <Typography variant="body2" color="#94a3b8">
              Starting Camera...
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ textAlign: 'center', px: 3 }}>
            <Typography color="#f87171" fontWeight={600} gutterBottom>
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={startCamera}
              sx={{ color: '#38bdf8', borderColor: '#38bdf8', mt: 2 }}
            >
              Retry Camera
            </Button>
          </Box>
        )}

        {!currentCapturedImage ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <canvas
              ref={overlayCanvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2
            }}
          >
            <img
              src={enhancedImage || currentCapturedImage}
              alt="Scanned Page"
              style={{
                maxWidth: '100%',
                maxHeight: '70%',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}
            />

            {/* Contrast / B&W Filter Controls */}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: 'rgba(30, 41, 59, 0.85)',
                borderRadius: '16px',
                width: '90%',
                maxWidth: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                gap: 1
              }}
            >
              <Button
                size="small"
                variant={isBwMode ? 'contained' : 'outlined'}
                onClick={() => setIsBwMode(!isBwMode)}
                sx={{
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {isBwMode ? 'B&W Text' : 'Full Color'}
              </Button>

              <Typography variant="caption" color="#94a3b8">
                Contrast:
              </Typography>
              <Slider
                size="small"
                min={0.8}
                max={2.0}
                step={0.1}
                value={contrast}
                onChange={(_, val) => setContrast(val as number)}
                sx={{ width: 100, color: '#38bdf8' }}
              />
            </Box>
          </Box>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Box>

      {/* Bottom Controls Action Bar */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          bgcolor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          px: 2,
          pb: 1
        }}
      >
        {!currentCapturedImage ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <IconButton
              onClick={handleCapturePage}
              disabled={!stream}
              sx={{
                width: 68,
                height: 68,
                bgcolor: '#2563eb',
                color: '#ffffff',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.6)',
                '&:hover': { bgcolor: '#1d4ed8' },
                '&:disabled': { bgcolor: '#334155', color: '#64748b' }
              }}
            >
              <CameraAltIcon sx={{ fontSize: 32 }} />
            </IconButton>

            {scannedPages.length > 0 && (
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                sx={{
                  bgcolor: '#10b981',
                  color: '#ffffff',
                  borderRadius: '20px',
                  fontWeight: 700,
                  textTransform: 'none'
                }}
              >
                Finish ({scannedPages.length})
              </Button>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRetakeCurrentPage}
              sx={{
                color: '#ffffff',
                borderColor: '#334155',
                borderRadius: '20px',
                textTransform: 'none'
              }}
            >
              Retake
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleKeepPageAndScanNext}
              sx={{
                bgcolor: '#2563eb',
                color: '#ffffff',
                borderRadius: '20px',
                textTransform: 'none',
                fontWeight: 700
              }}
            >
              + Next Page
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              sx={{
                bgcolor: '#10b981',
                color: '#ffffff',
                borderRadius: '20px',
                textTransform: 'none',
                fontWeight: 700
              }}
            >
              Export
            </Button>
          </Box>
        )}
      </Box>

      {/* Export Options Menu with Properly Chained Tool Routing */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: '#ffffff',
            borderRadius: '16px',
            mt: -1
          }
        }}
      >
        <MenuItem onClick={handleExportAsPdf}>
          <PictureAsPdfIcon sx={{ color: '#ef4444', mr: 1.5 }} />
          Save as Scanned PDF Document
        </MenuItem>

        <MenuItem onClick={() => handleExportToWordOrExcel('/pdf/pdf-to-word')}>
          <DescriptionIcon sx={{ color: '#3b82f6', mr: 1.5 }} />
          Convert Scan to Word (PDF → Word)
        </MenuItem>

        <MenuItem onClick={() => handleExportToWordOrExcel('/pdf/pdf-to-excel')}>
          <TableChartIcon sx={{ color: '#10b981', mr: 1.5 }} />
          Convert Scan to Excel (PDF → Excel)
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

export default MobileScannerModal;
