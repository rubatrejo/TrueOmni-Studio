'use client';

import type { ReactNode } from 'react';

import { deviceDims, useDevice } from './device-context';

/** Escala base del XD (375 de ancho) al canvas mobile de la PWA (390). Se
 *  conserva para las pantallas full-screen que aún usan el factor fijo. */
export const S = 390 / 375;

/**
 * Escala **device-aware** del espacio XD (375 de ancho) al ancho del canvas
 * actual. Phone = 390/375 (= `S`, sin cambios); Tablet = anchoTablet/375. Así
 * las pantallas basadas en `Layer` llenan el ancho del device con el MISMO
 * diseño (hero, quick-access, nav idénticos al PWA, solo más grandes), sin
 * re-maquetar. SSR/primer render = phone (hydration-safe vía `DeviceProvider`).
 */
/** Escala tablet (tunable). Más baja que el ancho completo (834/375≈2.22) para
 *  que el diseño no se vea gigante; el contenido se CENTRA (ver `Layer`) y los
 *  márgenes laterales quedan del bg del Layer (marca en header/hero). */
const TABLET_LAYER_SCALE = 1.62;

export function useLayerScale(): number {
  const { device, orientation } = useDevice();
  if (device === 'tablet') return TABLET_LAYER_SCALE;
  return deviceDims(device, orientation).w / 375;
}

/**
 * Capa con coordenadas verbatim del XD (375 de ancho) escalada al ancho del
 * canvas del device. Los hijos se posicionan en absoluto en el espacio 375; el
 * `transform: scale` crea el bloque contenedor para esos absolutos. En phone el
 * factor es 1.04 (idéntico al original); en tablet llena el ancho de la tablet.
 */
export function Layer({
  h,
  className,
  style,
  children,
}: {
  /** Alto en el espacio 375 (se renderiza a `h × escala del device`). */
  h: number;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const scale = useLayerScale();
  const { device, orientation } = useDevice();
  // En tablet el contenido (más chico que el ancho del canvas) se centra; los
  // márgenes muestran el bg del Layer (marca en header/hero/nav). En phone, 0.
  const canvasW = deviceDims(device, orientation).w;
  const offsetX = device === 'tablet' ? Math.max(0, (canvasW - 375 * scale) / 2) : 0;
  return (
    <div className={className} style={{ height: h * scale, overflow: 'hidden', ...style }}>
      <div
        style={{
          width: 375,
          height: h,
          marginLeft: offsetX,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}
