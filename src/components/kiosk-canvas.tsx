import type { ReactNode } from 'react';

/**
 * Canvas fijo 1080×1920 (retrato) centrado en el viewport.
 * Dimensiones y safe-areas vienen de tokens CSS (tokens.css del cliente activo).
 * NO usar literales de dimensión (ni en clases arbitrarias) — romperían el white-label.
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
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'var(--safe-area-bottom)',
          paddingLeft: 'var(--safe-area-x)',
          paddingRight: 'var(--safe-area-x)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
