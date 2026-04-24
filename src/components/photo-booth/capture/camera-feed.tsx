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
}

/**
 * Renderiza el feed de la cámara del kiosk en formato portrait 1080×1920.
 * En modo mock muestra una imagen estática del asset del cliente. El video
 * se rota con `object-cover` al retrato (la cámara suele dar 1920×1080 landscape).
 *
 * El ref permite al módulo padre tomar `video.currentSrc` para la captura.
 */
export const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(function CameraFeed(
  { permission, stream, mockImageSrc, className },
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
        transform: 'scaleX(-1)',
      }}
    />
  );
});
