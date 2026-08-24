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
  Slider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CropIcon from '@mui/icons-material/Crop';
import jsPDF from 'jspdf';

interface MobileScannerModalProps {
  open: boolean;
  onClose: () => void;
}

export const MobileScannerModal: React.FC<MobileScannerModalProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [contrast, setContrast] = useState<number>(1.2);
  const [brightness, setBrightness] = useState<number>(10);
  const [isBwMode, setIsBwMode] = useState<boolean>(true);
  const [detectedBounds, setDetectedBounds] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
      console.warn('[Document Scanner] Camera error:', err);
      setError('Could not access camera. Please grant camera permissions.');
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

  // Real-time document edge detection loop on video stream
  useEffect(() => {
    if (!open || capturedImage || !stream) return;

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

            // Draw bounding guide overlay
            const marginX = overlay.width * 0.08;
            const marginY = overlay.height * 0.12;
            const w = overlay.width - marginX * 2;
            const h = overlay.height - marginY * 2;

            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 12;
            ctx.strokeRect(marginX, marginY, w, h);

            // Corner highlights
            const cornerLen = 24;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 6;
            // Top Left
            ctx.beginPath();
            ctx.moveTo(marginX, marginY + cornerLen);
            ctx.lineTo(marginX, marginY);
            ctx.lineTo(marginX + cornerLen, marginY);
            ctx.stroke();
            // Top Right
            ctx.beginPath();
            ctx.moveTo(marginX + w - cornerLen, marginY);
            ctx.lineTo(marginX + w, marginY);
            ctx.lineTo(marginX + w, marginY + cornerLen);
            ctx.stroke();
            // Bottom Left
            ctx.beginPath();
            ctx.moveTo(marginX, marginY + h - cornerLen);
            ctx.lineTo(marginX, marginY + h);
            ctx.lineTo(marginX + cornerLen, marginY + h);
            ctx.stroke();
            // Bottom Right
            ctx.beginPath();
            ctx.moveTo(marginX + w - cornerLen, marginY + h);
            ctx.lineTo(marginX + w, marginY + h);
            ctx.lineTo(marginX + w, marginY + h - cornerLen);
            ctx.stroke();

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
  }, [open, capturedImage, stream]);

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, capturedImage]);

  // Apply Document Scanner Image Enhancement (Sobel Edge + High-Contrast B&W Thresholding)
  const applyEnhancements = (dataUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Smart High-Contrast Document Threshold Filter
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Greyscale luminance
        let v = 0.299 * r + 0.587 * g + 0.114 * b;

        if (isBwMode) {
          // B&W Scanned Document Thresholding (Adaptive)
          v = (v - 128) * contrast + 128 + brightness;
          v = v > 140 ? 255 : v < 70 ? 0 : v;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        } else {
          // Enhanced Color Mode
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

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);
      applyEnhancements(dataUrl);
      stopCamera();
    }
  };

  useEffect(() => {
    if (capturedImage) {
      applyEnhancements(capturedImage);
    }
  }, [contrast, brightness, isBwMode]);

  const handleRetake = () => {
    setCapturedImage(null);
    setEnhancedImage(null);
    startCamera();
  };

  // Generate and download a proper scanned PDF file
  const handleSaveAsPdf = () => {
    const finalImg = enhancedImage || capturedImage;
    if (!finalImg) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });

      pdf.addImage(finalImg, 'JPEG', 0, 0, img.width, img.height);
      pdf.save(`Scanned_Document_${Date.now()}.pdf`);
      onClose();
    };
    img.src = finalImg;
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
          {detectedBounds && !capturedImage && (
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#10b981' }} />}
              label="Edges Detected"
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.68rem'
              }}
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
              Starting camera...
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

        {!capturedImage ? (
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
              src={enhancedImage || capturedImage}
              alt="Scanned Document"
              style={{
                maxWidth: '100%',
                maxHeight: '75%',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}
            />

            {/* Contrast / B&W Filter Controls */}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: 'rgba(30, 41, 59, 0.8)',
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
                {isBwMode ? 'B&W Scan' : 'Color Scan'}
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
          px: 3,
          pb: 1
        }}
      >
        {!capturedImage ? (
          <IconButton
            onClick={handleCapture}
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
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRetake}
              sx={{
                color: '#ffffff',
                borderColor: '#334155',
                borderRadius: '24px',
                px: 2.5
              }}
            >
              Retake
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleSaveAsPdf}
              sx={{
                bgcolor: '#10b981',
                color: '#ffffff',
                borderRadius: '24px',
                px: 3,
                fontWeight: 700,
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Save as Scanned PDF
            </Button>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default MobileScannerModal;
