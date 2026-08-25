import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { PdfAnnotationCanvas, AnnotationStroke, PenToolType } from '../pdf/PdfAnnotationCanvas';

interface PdfPageViewItemProps {
  pageIndex: number; // 1-indexed
  pdfDoc: any;
  fitWidth: number;
  scale: number;
  pdfPageWidth: number;
  pdfPageHeight: number;
  activePenTool: PenToolType | null;
  strokes: AnnotationStroke[];
  onStrokesChange: (strokes: AnnotationStroke[]) => void;
  onPageVisible?: (pageIndex: number) => void;
}

export const PdfPageViewItem: React.FC<PdfPageViewItemProps> = ({
  pageIndex,
  pdfDoc,
  fitWidth,
  scale,
  pdfPageWidth,
  pdfPageHeight,
  activePenTool,
  strokes,
  onStrokesChange,
  onPageVisible
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRenderTaskRef = useRef<any>(null);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [rendered, setRendered] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Compute displayed pixel dimensions
  const displayWidth = Math.max(280, Math.floor(fitWidth * scale));
  const pageAspect = (pdfPageHeight || 792) / (pdfPageWidth || 612);
  const displayHeight = Math.floor(displayWidth * pageAspect);

  // 1. IntersectionObserver for Viewport Virtualization & Scroll Page Tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (onPageVisible) {
            onPageVisible(pageIndex);
          }
        } else {
          setIsVisible(false);
        }
      },
      { rootMargin: '250px 0px', threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageIndex, onPageVisible]);

  // 2. Render Page Canvas only when visible in Viewport
  useEffect(() => {
    if (!isVisible || !pdfDoc) return;

    let isCancelled = false;

    const renderPage = async () => {
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (e) {}
        activeRenderTaskRef.current = null;
      }

      try {
        setLoading(true);
        const page = await pdfDoc.getPage(pageIndex);
        if (isCancelled || !canvasRef.current) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
        // Vector scaling formula: fitWidth / pdfPageWidth * userScale * dpr
        const baseScale = displayWidth / (pdfPageWidth || 612);
        const viewportScale = baseScale * dpr;
        const viewport = page.getViewport({ scale: viewportScale });

        const canvas = canvasRef.current;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const renderTask = (page.render as any)({ canvasContext: ctx, viewport });
          activeRenderTaskRef.current = renderTask;
          await renderTask.promise;
          activeRenderTaskRef.current = null;
          if (!isCancelled) {
            setRendered(true);
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.warn(`[PdfPageViewItem] Page ${pageIndex} render notice:`, err);
          setLoading(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (e) {}
        activeRenderTaskRef.current = null;
      }
    };
  }, [isVisible, pdfDoc, pageIndex, displayWidth, pdfPageWidth, pdfPageHeight, scale]);

  return (
    <Box
      id={`pdf-page-${pageIndex}`}
      ref={containerRef}
      sx={{
        width: displayWidth,
        height: displayHeight,
        position: 'relative',
        mx: 'auto',
        my: 1.5,
        bgcolor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'width 0.15s ease, height 0.15s ease'
      }}
    >
      {/* Loading Spinner / Placeholder */}
      {(!rendered || loading) && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f8fafc',
            zIndex: 1
          }}
        >
          <CircularProgress size={28} sx={{ color: '#2563eb' }} />
        </Box>
      )}

      {/* Actual PDF Vector Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* Interactive Freehand Annotation Canvas Layer */}
      <PdfAnnotationCanvas
        pageIndex={pageIndex}
        pdfPageWidth={pdfPageWidth || 612}
        pdfPageHeight={pdfPageHeight || 792}
        width={displayWidth}
        height={displayHeight}
        activeTool={activePenTool}
        strokes={strokes}
        onStrokesChange={onStrokesChange}
      />
    </Box>
  );
};

export default PdfPageViewItem;
