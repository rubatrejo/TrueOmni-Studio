'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import type { CameraPermission } from '@/hooks/use-camera';

export interface CameraFeedHandle {
  /** Video element nativo — usado por `canvas.drawImage` al capturar el frame. */
  getVideo: () => HTMLVideoElement | null;
  /** Imagen mock usada cuando `permission === 'mock'`. */
  getMockImage: () => HTMLImageElement | null;
}

interface CameraFeedProps {
  permission: CameraPermission;
  stream: MediaStream | null;
  /** Asset path mock (`assets/photo-booth/mock/demo-camera.jpg`) ya resuelto. */
  mockImageSrc: string;
  className?: string;
  /**
   * Zoom de la cámara configurado por el operador en Studio. 1.0 = default.
   * Valores >1 hacen digital zoom-in (CSS `transform: scale`); valores <1
   * intentan zoom-out vía `track.applyConstraints({zoom})` si la webcam lo
   * soporta (algunas wide-angle/PTZ lo hacen). Si la cámara no soporta el
   * rango pedido, el `applyConstraints` falla silenciosamente y se queda
   * en el zoom nativo — el usuario ve la advertencia en el editor.
   */
  zoom?: number;
}

/**
 * Renderiza el feed de la cámara del kiosk en formato portrait 1080×1920.
 * En modo mock muestra una imagen estática del asset del cliente. El video
 * se rota con `object-cover` al retrato (la cámara suele dar 1920×1080 landscape).
 *
 * El ref permite al módulo padre tomar `video.currentSrc` para la captura.
 */
export const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(function CameraFeed(
  { permission, stream, mockImageSrc, className, zoom = 1 },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      getVideo: () => videoRef.current,
      getMockImage: () => imgRef.current,
    }),
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    const play = async () => {
      try {
        await video.play();
      } catch {
        // autoplay bloqueado; el kiosk está en touch-first, ignorable
      }
    };
    play();
  }, [stream]);

  // Aplicar el `zoom` configurado al stream usando MediaTrack constraints
  // cuando la cámara lo soporta (Chrome con webcam compatible). Para zoom-out
  // <1 esto requiere una cámara wide-angle / PTZ; si no soporta, fail silently
  // y dejamos que el CSS transform haga lo suyo.
  useEffect(() => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track || typeof track.getCapabilities !== 'function') return;
    const caps = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: { min: number; max: number; step?: number };
    };
    if (!caps.zoom) return;
    const clamped = Math.min(Math.max(zoom, caps.zoom.min), caps.zoom.max);
    track
      .applyConstraints({ advanced: [{ zoom: clamped } as MediaTrackConstraintSet] })
      .catch(() => {
        // applyConstraints rejecta si el valor está fuera de rango o la
        // cámara no acepta el constraint — dejamos el CSS scale como
        // fallback visual.
      });
  }, [stream, zoom]);

  // Estrategia del zoom (revisada por feedback del operador):
  //
  // ─ zoom > 1: digital zoom-IN. CSS `scale(zoom)` recorta del centro.
  // ─ zoom = 1: comportamiento default, sin transform.
  // ─ zoom < 1: NO se aplica scale al video — eso encogía el video y dejaba
  //   bordes que se veían raros aún con blur fill. El zoom-out real sólo se
  //   logra con cámara wide-angle/PTZ via `track.applyConstraints({zoom})`
  //   (ya manejado arriba). Si la webcam no soporta el constraint, el
  //   slider se ignora visualmente — el operador queda con la opción del
  //   slider intacta pero sin distorsionar el iframe del kiosk.
  const isZoomIn = zoom > 1;

  // En mock, idle (inicializando) y denied mostramos el mock image como fallback
  // visual para que el fondo nunca sea blanco durante la captura/permisos.
  if (permission === 'mock' || permission === 'idle' || permission === 'denied') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imgRef}
        src={mockImageSrc}
        alt=""
        draggable={false}
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: isZoomIn ? `scale(${zoom})` : undefined,
          transformOrigin: 'center',
        }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        transform: isZoomIn ? `scaleX(-1) scale(${zoom})` : 'scaleX(-1)',
        transformOrigin: 'center',
      }}
    />
  );
});
