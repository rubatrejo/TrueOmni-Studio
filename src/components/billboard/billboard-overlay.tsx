'use client';

import type { BillboardB0Config } from '@/lib/studio/schema';

type OverlayProps = {
  /** Modo legacy: opacidad de un overlay negro full-bleed. Se usa solo si
   *  `overlay.opacity === 0` y `overlay.mode !== 'gradient'`. */
  overlayOpacity: number;
  overlay: BillboardB0Config['overlay'];
};

/**
 * Capa de overlay configurable para billboards. Se monta entre el background
 * y el contenido. Soporta gradient, color sólido con opacidad, o el legacy
 * negro semitransparente. Si nada aplica, no renderiza nada.
 */
export function OverlayLayer({ overlayOpacity, overlay }: OverlayProps) {
  if (overlay.mode === 'gradient') {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${overlay.gradient.angle}deg, ${overlay.gradient.from}, ${overlay.gradient.to})`,
        }}
      />
    );
  }
  if (overlay.opacity > 0) {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: overlay.color, opacity: overlay.opacity }}
      />
    );
  }
  if (overlayOpacity > 0) {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
      />
    );
  }
  return null;
}
