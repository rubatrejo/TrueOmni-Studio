import type { ReactNode } from 'react';

/**
 * Canvas fijo 1080×1920 (retrato) centrado en el viewport.
 * Dimensiones vienen de los tokens `--kiosk-width`/`--kiosk-height`.
 *
 * El canvas NO añade padding. Cada pantalla del kiosk gestiona sus propios
 * bordes (full-bleed, safe-areas, etc.). Si necesitas safe-area, usa las
 * clases de Tailwind `p-safe-top`, `p-safe-x` o los tokens directamente.
 */
export function KioskCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        data-kiosk-canvas
        className="relative overflow-hidden bg-background text-foreground shadow-xl"
        style={{
          width: 'var(--kiosk-width)',
          height: 'var(--kiosk-height)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
