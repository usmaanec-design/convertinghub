import React, { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

export interface Point {
  x: number; // PDF page coordinate
  y: number; // PDF page coordinate
  pressure?: number;
}

export type PenToolType = 'blue_pen' | 'black_pen' | 'red_pen' | 'highlighter' | 'eraser';

export interface AnnotationStroke {
  id: string;
  type: PenToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
  points: Point[];
  pageIndex: number;
}

interface PdfAnnotationCanvasProps {
  pageIndex: number;
  pdfPageWidth?: number;
  pdfPageHeight?: number;
  width: number;
  height: number;
  activeTool: PenToolType | 'select' | 'hand' | null;
  strokes: AnnotationStroke[];
  onStrokesChange: (strokes: AnnotationStroke[]) => void;
  disabled?: boolean;
}

export const PEN_CONFIGS: Record<PenToolType, { color: string; width: number; opacity: number }> = {
  blue_pen: { color: '#2563eb', width: 3, opacity: 1.0 },
  black_pen: { color: '#000000', width: 3, opacity: 1.0 },
  red_pen: { color: '#dc2626', width: 3, opacity: 1.0 },
  highlighter: { color: '#facc15', width: 18, opacity: 0.4 },
  eraser: { color: '#ffffff', width: 24, opacity: 1.0 }
};

export const PdfAnnotationCanvas: React.FC<PdfAnnotationCanvasProps> = ({
  pageIndex,
  pdfPageWidth = 612,
  pdfPageHeight = 792,
  width,
  height,
  activeTool,
  strokes,
  onStrokesChange,
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<Point[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const scaleX = width / (pdfPageWidth || 1);
  const scaleY = height / (pdfPageHeight || 1);

  const toPdfCoords = useCallback(
    (canvasX: number, canvasY: number, pressure = 0.5): Point => {
      return {
        x: Math.max(0, Math.min(pdfPageWidth, canvasX / scaleX)),
        y: Math.max(0, Math.min(pdfPageHeight, canvasY / scaleY)),
        pressure
      };
    },
    [pdfPageWidth, pdfPageHeight, scaleX, scaleY]
  );

  const toScreenCoords = useCallback(
    (pt: Point) => {
      return {
        x: pt.x * scaleX,
        y: pt.y * scaleY
      };
    },
    [scaleX, scaleY]
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderStroke = (stroke: AnnotationStroke, strokePoints: Point[]) => {
      if (strokePoints.length === 0) return;

      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.strokeWidth * scaleX;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity;
        ctx.lineWidth = stroke.strokeWidth * scaleX;
      }

      const screenPts = strokePoints.map(toScreenCoords);

      if (screenPts.length === 1) {
        ctx.arc(screenPts[0].x, screenPts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(screenPts[0].x, screenPts[0].y);
        for (let i = 1; i < screenPts.length - 1; i++) {
          const midX = (screenPts[i].x + screenPts[i + 1].x) / 2;
          const midY = (screenPts[i].y + screenPts[i + 1].y) / 2;
          ctx.quadraticCurveTo(screenPts[i].x, screenPts[i].y, midX, midY);
        }
        ctx.lineTo(
          screenPts[screenPts.length - 1].x,
          screenPts[screenPts.length - 1].y
        );
        ctx.stroke();
      }

      ctx.restore();
    };

    // Render committed strokes
    strokes.forEach((stroke) => {
      renderStroke(stroke, stroke.points);
    });

    // Render active stroke directly from ref
    if (isDrawingRef.current && currentPointsRef.current.length > 0 && activeTool && PEN_CONFIGS[activeTool as PenToolType]) {
      const cfg = PEN_CONFIGS[activeTool as PenToolType];
      const activeStroke: AnnotationStroke = {
        id: 'active',
        type: activeTool as PenToolType,
        color: cfg.color,
        strokeWidth: cfg.width,
        opacity: cfg.opacity,
        points: currentPointsRef.current,
        pageIndex
      };
      renderStroke(activeStroke, currentPointsRef.current);
    }
  }, [strokes, activeTool, pageIndex, toScreenCoords, scaleX]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const requestRedraw = () => {
    if (animFrameRef.current) return;
    animFrameRef.current = requestAnimationFrame(() => {
      redrawCanvas();
      animFrameRef.current = null;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !activeTool || !PEN_CONFIGS[activeTool as PenToolType]) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const pt = toPdfCoords(offsetX, offsetY, e.pressure || 0.5);

    if (activeTool === 'eraser') {
      const threshold = 15;
      const filtered = strokes.filter((s) => {
        return !s.points.some((p) => {
          const sp = toScreenCoords(p);
          const dx = sp.x - offsetX;
          const dy = sp.y - offsetY;
          return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
      });
      if (filtered.length !== strokes.length) {
        onStrokesChange(filtered);
      }
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [pt];
    requestRedraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    if (activeTool === 'eraser' && e.buttons === 1) {
      const threshold = 20;
      const filtered = strokes.filter((s) => {
        return !s.points.some((p) => {
          const sp = toScreenCoords(p);
          const dx = sp.x - offsetX;
          const dy = sp.y - offsetY;
          return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
      });
      if (filtered.length !== strokes.length) {
        onStrokesChange(filtered);
      }
      return;
    }

    if (!isDrawingRef.current) return;

    e.preventDefault();
    const pt = toPdfCoords(offsetX, offsetY, e.pressure || 0.5);
    currentPointsRef.current.push(pt);
    requestRedraw();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 0 && activeTool && activeTool !== 'eraser') {
      const cfg = PEN_CONFIGS[activeTool as PenToolType];
      const newStroke: AnnotationStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: activeTool as PenToolType,
        color: cfg.color,
        strokeWidth: cfg.width,
        opacity: cfg.opacity,
        points: [...currentPointsRef.current],
        pageIndex
      };
      onStrokesChange([...strokes, newStroke]);
    }

    currentPointsRef.current = [];
    requestRedraw();
  };

  const isInteractive = activeTool && Boolean(PEN_CONFIGS[activeTool as PenToolType]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: isInteractive ? 'auto' : 'none',
        zIndex: 5,
        touchAction: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isInteractive ? 'crosshair' : 'default'
        }}
      />
    </Box>
  );
};

export default PdfAnnotationCanvas;
