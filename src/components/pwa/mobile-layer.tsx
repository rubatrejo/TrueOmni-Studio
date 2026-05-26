import type { ReactNode } from 'react';

/** Escala del XD (375 de ancho) al canvas de la PWA (390). */
export const S = 390 / 375;

/**
 * Capa con coordenadas verbatim del XD (375 de ancho) escalada ×1.04 al canvas
 * 390 de la PWA. Los hijos se posicionan en absoluto en el espacio 375; el
 * `transform: scale` crea el bloque contenedor para esos absolutos.
 */
export function Layer({
  h,
  className,
  style,
  children,
}: {
  /** Alto en el espacio 375 (se renderiza a `h × S`). */
  h: number;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={className} style={{ height: h * S, overflow: 'hidden', ...style }}>
      <div style={{ width: 375, height: h, transform: `scale(${S})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}
