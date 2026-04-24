'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useCamera } from '@/hooks/use-camera';
import { useCountdown } from '@/hooks/use-countdown';
import { usePhotoSession } from '@/hooks/use-photo-session';
import type { PhotoBoothConfig } from '@/lib/config';
import { composeFinal, type StickerPlacement } from '@/lib/photo-booth-compose';
import { segmentSelfie, warmupSegmenter } from '@/lib/photo-booth-segment';

import { CameraFeed, type CameraFeedHandle } from './capture/camera-feed';
import { PermissionGate } from './capture/permission-gate';
import { CountdownOverlay } from './screens/countdown-overlay';
import { EditorScreen } from './screens/editor-screen';
import { KioskHeader } from './screens/kiosk-header';
import { StartScreen } from './screens/start-screen';

type Phase = 'live' | 'countdown' | 'capturing' | 'editing' | 'sharing';

interface PhotoBoothTextos {
  timerOn: string;
  timerOff: string;
  startLabel: string;
  experienceLabel: string;
  permissionTitle: string;
  permissionBody: string;
  permissionRetry: string;
  processing: string;
  ariaHome: string;
  ariaShutter: string;
  ariaBack: string;
  ariaClose: string;
  retakeLabel: string;
  shareCta: string;
}

interface PhotoBoothModuleProps {
  config: PhotoBoothConfig;
  resolvedBackgrounds: Array<PhotoBoothConfig['backgrounds'][number] & { resolvedImage: string }>;
  mockImageSrc: string;
  textos: PhotoBoothTextos;
  logoSrc: string;
  logoAlt: string;
  headerTime: string;
  headerDate: string;
  headerTempLabel?: string;
}

/**
 * Descarga una imagen remota como HTMLImageElement (crossOrigin='anonymous'
 * para evitar tainted canvas). Usado por `composeFinal` cuando la fuente
 * no es ya un ImageBitmap.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Orquestador del módulo Photo Booth. La live camera y el header son
 * layers permanentes; cada fase renderiza su overlay específico encima.
 *
 * Ola 2 cubrió 'live' y 'countdown'. Ola 3 añade 'capturing' (real) y
 * un stub de 'editing'. Ola 4 implementa el editor pixel-perfect.
 */
export function PhotoBoothModule({
  config,
  resolvedBackgrounds,
  mockImageSrc,
  textos,
  logoSrc,
  logoAlt,
  headerTime,
  headerDate,
  headerTempLabel,
}: PhotoBoothModuleProps) {
  const router = useRouter();
  const camera = useCamera();
  const countdown = useCountdown();
  const cameraRef = useRef<CameraFeedHandle>(null);
  const session = usePhotoSession();

  const [phase, setPhase] = useState<Phase>('live');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(
    resolvedBackgrounds[0]?.id ?? null,
  );
  const [hasTouchedBackground, setHasTouchedBackground] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const timerOptions = config.timer?.options ?? [3, 5, 10];
  const timerDefault = config.timer?.default ?? 10;
  const timerEnabled = config.timer?.enabled !== false;
  const [timerSeconds, setTimerSeconds] = useState<number>(timerEnabled ? timerDefault : -1);

  // Mount: abrir cámara + precargar MediaPipe
  useEffect(() => {
    void camera.start();
    warmupSegmenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = async () => {
    setCaptureError(null);
    try {
      const video = cameraRef.current?.getVideo();
      const mockImage = cameraRef.current?.getMockImage();
      const source = camera.permission === 'mock' ? mockImage : video;
      if (!source) throw new Error('Camera source not ready');
      const captureWidth =
        source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
      const captureHeight =
        source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
      if (!captureWidth || !captureHeight) throw new Error('Camera source has no dimensions');

      const segResult = await segmentSelfie(source);
      const bg = resolvedBackgrounds.find((b) => b.id === selectedBackgroundId) ??
        resolvedBackgrounds[0];
      const backgroundImg = bg ? await loadImage(bg.resolvedImage) : null;
      const stickers: StickerPlacement[] = [];
      const blob = await composeFinal({
        capture: source,
        captureWidth,
        captureHeight,
        mask: segResult.mask,
        background: backgroundImg,
        frame: null,
        stickers,
        cssFilter: 'none',
        edgeFeather: config.edgeFeather ?? 3,
      });
      session.setBlob(blob);
      setPhase('editing');
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Capture failed');
      setPhase('live');
    }
  };

  const handleStart = () => {
    if (phase !== 'live') return;
    if (timerSeconds > 0) {
      setPhase('countdown');
      countdown.start(timerSeconds, () => {
        setPhase('capturing');
        void capture();
      });
    } else {
      setPhase('capturing');
      void capture();
    }
  };

  const handleToggleTimer = () => {
    if (!timerEnabled) return;
    if (timerSeconds === -1) {
      setTimerSeconds(timerOptions[0] ?? 3);
      return;
    }
    const idx = timerOptions.indexOf(timerSeconds);
    if (idx < 0 || idx === timerOptions.length - 1) {
      setTimerSeconds(-1);
    } else {
      setTimerSeconds(timerOptions[idx + 1] ?? -1);
    }
  };

  const onSelectBackground = (id: string) => {
    setSelectedBackgroundId(id);
    setHasTouchedBackground(true);
  };

  const handleRetake = () => {
    session.setBlob(null);
    setPhase('live');
  };

  const handleShare = () => {
    setPhase('sharing');
    // TODO(Ola 5): share modal + QR
  };

  const timerLabel =
    timerSeconds > 0
      ? textos.timerOn.replaceAll('{seconds}', String(timerSeconds))
      : textos.timerOff;

  if (camera.permission === 'denied') {
    return (
      <PermissionGate
        title={textos.permissionTitle}
        body={textos.permissionBody}
        retryLabel={textos.permissionRetry}
        onRetry={() => void camera.retry()}
      />
    );
  }

  const backgroundsForStart = resolvedBackgrounds.map((b) => ({
    ...b,
    image: b.resolvedImage,
    thumbnail: b.resolvedImage,
  }));

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ width: 1080, height: 1920, background: 'hsl(var(--photo-bg))' }}
    >
      {/* Layer 1: live camera (visible durante live/countdown/capturing) */}
      {(phase === 'live' || phase === 'countdown' || phase === 'capturing') && (
        <CameraFeed
          ref={cameraRef}
          permission={camera.permission}
          stream={camera.stream}
          mockImageSrc={mockImageSrc}
        />
      )}

      {/* Layer 2: header */}
      {(phase === 'live' || phase === 'countdown' || phase === 'capturing') && (
        <KioskHeader
          logoSrc={logoSrc}
          logoAlt={logoAlt}
          time={headerTime}
          date={headerDate}
          tempLabel={headerTempLabel}
        />
      )}

      {/* Layer 3: fase activa */}
      {phase === 'live' && (
        <StartScreen
          backgrounds={backgroundsForStart}
          selectedBackgroundId={selectedBackgroundId}
          hasTouchedBackground={hasTouchedBackground}
          onSelectBackground={onSelectBackground}
          onStart={handleStart}
          onToggleTimer={handleToggleTimer}
          onHome={() => router.push('/home')}
          timerLabel={timerLabel}
          experienceLabel={textos.experienceLabel}
          startLabel={textos.startLabel}
          ariaHome={textos.ariaHome}
          ariaShutter={textos.ariaShutter}
        />
      )}

      {phase === 'countdown' && <CountdownOverlay value={countdown.value} />}

      {phase === 'capturing' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'hsl(var(--photo-countdown-bg) / 0.55)' }}
        >
          <span
            style={{
              color: 'hsl(var(--photo-share-title))',
              fontSize: 36,
              fontFamily: 'var(--font-display)',
            }}
          >
            {textos.processing}
          </span>
        </div>
      )}

      {phase === 'editing' && (
        <EditorScreen
          blobUrl={session.blobUrl}
          onBack={handleRetake}
          onShare={handleShare}
          backLabel={textos.retakeLabel}
          shareLabel={textos.shareCta}
        />
      )}

      {phase === 'sharing' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'hsl(var(--photo-share-bg))' }}
        >
          <div style={{ color: '#fff', fontSize: 36 }}>Share screen (Ola 5)</div>
        </div>
      )}

      {captureError && (
        <div
          className="absolute"
          style={{
            left: 40,
            bottom: 40,
            padding: '12px 20px',
            background: 'rgb(0 0 0 / 0.7)',
            color: '#fff',
            borderRadius: 12,
            fontSize: 18,
          }}
        >
          {captureError}
        </div>
      )}
    </div>
  );
}
