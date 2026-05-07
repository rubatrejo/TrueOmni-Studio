'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * <SignageStage>
 *
 * Wrapper canvas 1920×1080 fijo que se escala uniformemente al viewport
 * (fit-contain con letterbox). Preserva pixel-perfect a 4K (scale 2.0) y
 * gestiona aspect ratios raros con barras tokenizadas vía --signage-stage-bg.
 *
 * No registra event listeners de touch/click — signage es view-only.
 *
 * Props:
 *  - children: contenido renderizado a 1920×1080 base.
 *  - debug: si true, muestra un overlay top-right con el factor de escala
 *    actual (útil en QA visual). NO afecta render del producto.
 */
export interface SignageStageProps {
  children: ReactNode;
  debug?: boolean;
}

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

export function SignageStage({ children, debug = false }: SignageStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function compute() {
      const node = containerRef.current;
      if (!node) return;
      const { clientWidth, clientHeight } = node;
      if (clientWidth <= 0 || clientHeight <= 0) return;
      const sx = clientWidth / BASE_WIDTH;
      const sy = clientHeight / BASE_HEIGHT;
      setScale(Math.min(sx, sy));
    }
    compute();
    const obs =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => compute())
        : null;
    if (obs && containerRef.current) obs.observe(containerRef.current);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('resize', compute);
      obs?.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: 'hsl(var(--signage-stage-bg))' }}
      aria-hidden={false}
    >
      <div
        className="absolute"
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
        {debug ? (
          <div
            className="absolute right-4 top-4 rounded bg-black/70 px-3 py-1 font-mono text-sm text-white"
            data-signage-debug
          >
            scale {scale.toFixed(3)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
