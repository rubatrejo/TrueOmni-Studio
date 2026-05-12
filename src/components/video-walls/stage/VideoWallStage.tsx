'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { canvasDimensionsOf, CELL, type GridConfig } from '@/lib/video-walls/dimensions';

/**
 * <VideoWallStage>
 *
 * Wrapper canvas del producto video-walls. Tiene dos modos:
 *
 *  1. Preview completo (sin `cell` prop):
 *     - Canvas absoluto sizing `cols×1920 × rows×1080`.
 *     - Fit-contain al viewport con escalado uniforme (mismo patrón
 *       que SignageStage). Letterbox tokenizado vía
 *       `--signage-stage-bg`.
 *     - Lo usa el editor PreviewPanel para mostrar el wall completo.
 *
 *  2. Crop por celda (con `cell={row,col}`):
 *     - Wrapper outer 1920×1080 con `overflow: hidden`.
 *     - Canvas interior con `transform: translate(-col*1920, -row*1080)`.
 *     - GPU-accelerated, cero JS overhead. Cada TV físico carga la URL
 *       con `?cell=r,c` y ve su porción 1:1.
 *     - Si el viewport del TV NO es 1920×1080 exacto, también
 *       aplicamos un fit-contain wrapper alrededor (mismo patrón
 *       fit-contain del modo preview pero del cell rect en lugar del
 *       canvas completo).
 */
export interface VideoWallStageProps {
  children: ReactNode;
  grid: GridConfig;
  /** Si está set, el stage solo muestra la porción 1920×1080 de la
   *  celda pedida. Sin set → preview completo. */
  cell?: { row: number; col: number };
  debug?: boolean;
}

export function VideoWallStage({ children, grid, cell, debug = false }: VideoWallStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const { width: canvasW, height: canvasH } = canvasDimensionsOf(grid);

  const viewportW = cell ? CELL.w : canvasW;
  const viewportH = cell ? CELL.h : canvasH;

  useEffect(() => {
    function compute() {
      const node = containerRef.current;
      if (!node) return;
      const { clientWidth, clientHeight } = node;
      if (clientWidth <= 0 || clientHeight <= 0) return;
      const sx = clientWidth / viewportW;
      const sy = clientHeight / viewportH;
      setScale(Math.min(sx, sy));
    }
    compute();
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => compute()) : null;
    if (obs && containerRef.current) obs.observe(containerRef.current);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('resize', compute);
      obs?.disconnect();
    };
  }, [viewportW, viewportH]);

  // Wrapper escalado al viewport del navegador.
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: 'hsl(var(--signage-stage-bg, 222 47% 5%))' }}
    >
      <div
        className="absolute"
        style={{
          width: viewportW,
          height: viewportH,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {cell ? (
          // Cell mode: outer 1920×1080 con overflow hidden; el canvas total se traslada.
          <div className="relative" style={{ width: CELL.w, height: CELL.h, overflow: 'hidden' }}>
            <div
              className="absolute"
              style={{
                width: canvasW,
                height: canvasH,
                left: 0,
                top: 0,
                transform: `translate(${-cell.col * CELL.w}px, ${-cell.row * CELL.h}px)`,
              }}
            >
              {children}
            </div>
          </div>
        ) : (
          // Preview completo: canvas absoluto.
          <div className="relative" style={{ width: canvasW, height: canvasH }}>
            {children}
          </div>
        )}
        {debug ? (
          <div
            className="absolute right-4 top-4 rounded bg-black/70 px-3 py-1 font-mono text-sm text-white"
            data-video-wall-debug
          >
            scale {scale.toFixed(3)} · {grid} · {cell ? `cell ${cell.row},${cell.col}` : 'preview'}
          </div>
        ) : null}
      </div>
    </div>
  );
}
