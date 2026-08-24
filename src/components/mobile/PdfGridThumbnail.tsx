import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface PdfGridThumbnailProps {
  fileObj?: File;
  fileUrl?: string;
  width?: number;
  height?: number;
}

export const PdfGridThumbnail: React.FC<PdfGridThumbnailProps> = ({
  fileObj,
  fileUrl,
  width = 160,
  height = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    const renderThumbnail = async () => {
      try {
        let pdfData: Uint8Array | string | null = null;
        if (fileObj) {
          const buffer = await fileObj.arrayBuffer();
          pdfData = new Uint8Array(buffer);
        } else if (fileUrl) {
          pdfData = fileUrl;
        }

        if (!pdfData) {
          if (isMounted) setError(true);
          return;
        }

        const loadingTask = pdfjsLib.getDocument(
          typeof pdfData === 'string' ? pdfData : { data: pdfData }
        );
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        if (!isMounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: 0.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await (page.render as any)({
          canvasContext: context,
          viewport
        }).promise;

        if (isMounted) setLoading(false);
      } catch (err) {
        console.warn('[PdfGridThumbnail] Failed to render page-1 thumbnail:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderThumbnail();

    return () => {
      isMounted = false;
    };
  }, [fileObj, fileUrl]);

  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fef2f2'
        }}
      >
        <PictureAsPdfIcon sx={{ fontSize: 40, color: '#ef4444' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        bgcolor: '#f8fafc'
      }}
    >
      {loading && (
        <CircularProgress
          size={24}
          sx={{ color: '#2563eb', position: 'absolute' }}
        />
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: loading ? 'none' : 'block'
        }}
      />
    </Box>
  );
};

export default PdfGridThumbnail;
