'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import {
  SIGNAGE_ORIENTATION_DIMENSIONS,
  SIGNAGE_ORIENTATIONS,
  type SignageOrientation,
} from '@/lib/signage/schema';

import { useSignageBridgeStore } from '../runtime/signage-bridge-store';

/**
 * <SignageStage>
 *
 * Wrapper canvas con dimensiones base según orientation (1920×1080 landscape
 * o 1080×1920 portrait) que se escala uniformemente al viewport (fit-contain
 * con letterbox). Preserva pixel-perfect a 4K (scale 2.0) y gestiona aspect
 * ratios raros con barras tokenizadas vía --signage-stage-bg.
 *
 * No registra event listeners de touch/click — signage es view-only.
 *
 * Props:
 *  - children: contenido renderizado al canvas base de la orientation.
 *  - orientation: 'landscape' | 'portrait'. Default landscape para
 *    back-compat con callers pre-portrait.
 *  - debug: si true, muestra un overlay top-right con el factor de escala
 *    actual (útil en QA visual). NO afecta render del producto.
 */
export interface SignageStageProps {
  children: ReactNode;
  orientation?: SignageOrientation;
  debug?: boolean;
}

export function SignageStage({
  children,
  orientation: initialOrientation = 'landscape',
  debug = false,
}: SignageStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // El editor del Studio puede patchear orientation en vivo via postMessage
  // (toggle del PreviewPanel). Cuando hay patch en el bridge, gana sobre la
  // prop server-rendered.
  const patchOrientation = useSignageBridgeStore((s) => s.displayPatch?.settings?.orientation);
  const orientation: SignageOrientation =
    patchOrientation && (SIGNAGE_ORIENTATIONS as readonly string[]).includes(patchOrientation)
      ? patchOrientation
      : initialOrientation;

  const { w: baseWidth, h: baseHeight } = SIGNAGE_ORIENTATION_DIMENSIONS[orientation];

  useEffect(() => {
    function compute() {
      const node = containerRef.current;
      if (!node) return;
      const { clientWidth, clientHeight } = node;
      if (clientWidth <= 0 || clientHeight <= 0) return;
      const sx = clientWidth / baseWidth;
      const sy = clientHeight / baseHeight;
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
  }, [baseWidth, baseHeight]);

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
          width: baseWidth,
          height: baseHeight,
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
            scale {scale.toFixed(3)} · {orientation}
          </div>
        ) : null}
      </div>
    </div>
  );
}
