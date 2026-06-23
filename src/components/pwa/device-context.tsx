'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Form factor del runtime de la PWA. El producto **Tablet** reutiliza TODO el
 * runtime de la PWA (mismas rutas, mismo bridge, mismos datos `features.pwa`),
 * cambiando solo el LAYOUT de cada pantalla para cubrir la tablet (reflow).
 *
 * - `phone` (default): el diseño mobile 390×844 verbatim del XD (sin tocar).
 * - `tablet`: el mismo contenido re-acomodado a las dimensiones de la tablet.
 *
 * El device se decide por query param de la URL inicial (`?device=tablet&
 * orientation=landscape`) que pone el preview del Studio y, en un despliegue
 * real, el arranque del dispositivo. El provider vive en el layout `(pwa)`, así
 * que se monta UNA vez y persiste entre navegaciones internas del iframe (el
 * router de Next no remonta el layout), aunque las rutas hijas pierdan el param.
 */
export type Device = 'phone' | 'tablet';
export type Orientation = 'portrait' | 'landscape';

/** Dimensiones de referencia por device/orientación (px). Tablet = iPad 11". */
export const DEVICE_DIMS: Record<string, { w: number; h: number }> = {
  phone: { w: 390, h: 844 },
  'tablet-portrait': { w: 834, h: 1194 },
  'tablet-landscape': { w: 1194, h: 834 },
};

/**
 * Alto reservado arriba del canvas en TABLET para la barra de estado del SO
 * (hora + batería/wifi). El chrome (header navy) se extiende este alto extra para
 * que el contenido del header no quede tapado por la status bar del dispositivo.
 * Solo aplica a tablet; en phone el notch se maneja por pantalla (`pt-11`).
 */
export const TABLET_STATUS_INSET = 40;

export function deviceDims(device: Device, orientation: Orientation): { w: number; h: number } {
  if (device === 'tablet') {
    return orientation === 'landscape'
      ? DEVICE_DIMS['tablet-landscape']
      : DEVICE_DIMS['tablet-portrait'];
  }
  return DEVICE_DIMS.phone;
}

type DeviceContextValue = {
  device: Device;
  orientation: Orientation;
  /** True si el form factor es tablet (azúcar para los componentes). */
  isTablet: boolean;
};

const DeviceContext = createContext<DeviceContextValue>({
  device: 'phone',
  orientation: 'portrait',
  isTablet: false,
});

export function DeviceProvider({ children }: { children: ReactNode }) {
  // SSR no conoce la URL del cliente → arrancamos en phone (hydration-safe) y
  // leemos el device real tras mount. Igual patrón que la detección de
  // embedded/standalone del MobileCanvas.
  const [value, setValue] = useState<DeviceContextValue>({
    device: 'phone',
    orientation: 'portrait',
    isTablet: false,
  });

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const device: Device = params.get('device') === 'tablet' ? 'tablet' : 'phone';
      const orientation: Orientation =
        params.get('orientation') === 'landscape' ? 'landscape' : 'portrait';
      setValue({ device, orientation, isTablet: device === 'tablet' });
    } catch {
      /* ignore — sin window/params nos quedamos en phone */
    }
  }, []);

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice(): DeviceContextValue {
  return useContext(DeviceContext);
}
