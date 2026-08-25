import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

// In-Memory L1 Thumbnail Cache
const l1ThumbnailCache = new Map<string, string>();

interface PdfGridThumbnailProps {
  docId?: string;
  fileObj?: File | Blob;
  fileUrl?: string;
}

export const PdfGridThumbnail: React.FC<PdfGridThumbnailProps> = ({
  docId,
  fileObj,
  fileUrl
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cachedUrl, setCachedUrl] = useState<string | null>(() => {
    const key = docId || fileUrl || (fileObj ? (fileObj as File).name : null);
    return key ? l1ThumbnailCache.get(key) || null : null;
  });
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(!cachedUrl);
  const [error, setError] = useState(false);

  // 1. IntersectionObserver for Viewport Visibility
  useEffect(() => {
    if (cachedUrl) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [cachedUrl]);

  // 2. Render Page-1 Thumbnail asynchronously only when visible
  useEffect(() => {
    if (cachedUrl || !isVisible) return;

    let isCancelled = false;
    let renderTask: any = null;
    let loadingTask: any = null;

    setLoading(true);
    setError(false);

    const renderThumbnail = async () => {
      try {
        let pdfData: Uint8Array | string | null = null;
        if (fileObj) {
          const buffer = await fileObj.arrayBuffer();
          if (isCancelled) return;
          pdfData = new Uint8Array(buffer);
        } else if (fileUrl) {
          pdfData = fileUrl;
        }

        if (!pdfData || isCancelled) return;

        loadingTask = pdfjsLib.getDocument(
          typeof pdfData === 'string' ? pdfData : { data: pdfData }
        );
        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        const page = await pdf.getPage(1);
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: 0.35 });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        renderTask = (page.render as any)({
          canvasContext: context,
          viewport
        });

        await renderTask.promise;
        if (isCancelled) return;

        // Convert tiny canvas to data URL & store in L1 Cache
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const key = docId || fileUrl || (fileObj ? (fileObj as File).name : null);
        if (key) {
          l1ThumbnailCache.set(key, dataUrl);
        }

        setCachedUrl(dataUrl);
        setLoading(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.warn('[PdfGridThumbnail] Thumbnail render skipped:', err);
          setError(true);
          setLoading(false);
        }
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (e) {}
      }
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch (e) {}
      }
    };
  }, [isVisible, cachedUrl, docId, fileObj, fileUrl]);

  if (error) {
    return (
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fef2f2'
        }}
      >
        <PictureAsPdfIcon sx={{ fontSize: 36, color: '#ef4444' }} />
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
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
      {cachedUrl ? (
        <img
          src={cachedUrl}
          alt="PDF Thumbnail"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <>
          {loading && (
            <CircularProgress
              size={20}
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
        </>
      )}
    </Box>
  );
};

export default PdfGridThumbnail;
