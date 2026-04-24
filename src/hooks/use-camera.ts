'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Estado del permiso y del stream de la cámara del kiosk.
 * `permission`:
 *  - `'idle'`: todavía no se pidió.
 *  - `'granted'`: hay `stream` activo.
 *  - `'denied'`: el usuario rechazó o falló `getUserMedia`.
 *  - `'mock'`: modo mock activado por `NEXT_PUBLIC_KIOSK_PHOTO_MOCK=1`.
 */
export type CameraPermission = 'idle' | 'granted' | 'denied' | 'mock';

export interface UseCameraResult {
  permission: CameraPermission;
  stream: MediaStream | null;
  error: string | null;
  /** Pide permiso y abre el stream. En modo mock resuelve sin hacer nada. */
  start: () => Promise<void>;
  /** Cierra todos los tracks y libera el stream. */
  stop: () => void;
  /** Fuerza retry tras denial. */
  retry: () => Promise<void>;
}

function isMockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_KIOSK_PHOTO_MOCK === '1') return true;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('mock') === '1') return true;
  } catch {
    // ignore
  }
  return false;
}

/* Nota: antes había un auto-fallback a mock en dev cuando `getUserMedia`
 * fallaba, pero eso ocultaba el flujo de permisos al usuario en Chrome/
 * Safari del kiosk. Ahora si falla cae a `'denied'` → `PermissionGate`
 * con botón "Try again", salvo que el usuario entre con `?mock=1`. */

/**
 * Hook de acceso a la webcam del kiosk con fallback a modo mock.
 * Aplica constraints 1920×1080 ideal con facingMode 'user'.
 * Se encarga de limpiar tracks al desmontar el componente.
 */
export function useCamera(): UseCameraResult {
  const [permission, setPermission] = useState<CameraPermission>('idle');
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    if (isMockEnabled()) {
      setPermission('mock');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 9 / 16 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      setPermission('granted');
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera unavailable';
      setError(msg);
      setPermission('denied');
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return {
    permission,
    stream: streamRef.current,
    error,
    start,
    stop,
    retry: start,
  };
}
