'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useCamera } from '@/hooks/use-camera';
import { useCountdown } from '@/hooks/use-countdown';
import { usePhotoSession } from '@/hooks/use-photo-session';
import type { PhotoBoothConfig, PhotoBoothSticker } from '@/lib/config';
import { composeFinal, type StickerPlacement } from '@/lib/photo-booth-compose';
import { segmentSelfie, warmupSegmenter } from '@/lib/photo-booth-segment';

import { CameraFeed, type CameraFeedHandle } from './capture/camera-feed';
import { PermissionGate } from './capture/permission-gate';
import type { EditorTab } from './editor/editor-tabs';
import type { PlacedSticker } from './editor/sticker-layer';
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
  ariaShare: string;
  tabBackgrounds: string;
  tabFrames: string;
  tabFilters: string;
}

interface PhotoBoothModuleProps {
  config: PhotoBoothConfig;
  resolvedBackgrounds: Array<PhotoBoothConfig['backgrounds'][number] & { resolvedImage: string }>;
  resolvedFrames: Array<PhotoBoothConfig['frames'][number] & { resolvedImage: string }>;
  resolvedStickers: Array<PhotoBoothSticker & { resolvedImage: string }>;
  filters: PhotoBoothConfig['filters'];
  mockImageSrc: string;
  textos: PhotoBoothTextos;
  logoSrc: string;
  logoAlt: string;
  headerTime: string;
  headerDate: string;
  headerTempLabel?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function PhotoBoothModule({
  config,
  resolvedBackgrounds,
  resolvedFrames,
  resolvedStickers,
  filters,
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

  // Estado captura (se preserva entre re-composes del editor)
  const captureRef = useRef<{
    bitmap: ImageBitmap | null;
    mask: Uint8Array;
    width: number;
    height: number;
  } | null>(null);

  const [phase, setPhase] = useState<Phase>('live');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(
    resolvedBackgrounds[0]?.id ?? null,
  );
  const [hasTouchedBackground, setHasTouchedBackground] = useState(false);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(filters[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<EditorTab>('backgrounds');
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const timerOptions = config.timer?.options ?? [3, 5, 10];
  const timerDefault = config.timer?.default ?? 10;
  const timerEnabled = config.timer?.enabled !== false;
  const [timerSeconds, setTimerSeconds] = useState<number>(timerEnabled ? timerDefault : -1);

  useEffect(() => {
    void camera.start();
    warmupSegmenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Recompone el blob con el background actualmente seleccionado. Usa el
   * frame+mask cacheados en `captureRef`. Llamado tras la captura inicial y
   * cada vez que el usuario cambia de background en el editor.
   */
  const recomposeBaseBlob = async (backgroundId: string | null) => {
    const c = captureRef.current;
    if (!c || !c.bitmap) return;
    const bg = resolvedBackgrounds.find((b) => b.id === backgroundId) ?? resolvedBackgrounds[0];
    const backgroundImg = bg ? await loadImage(bg.resolvedImage) : null;
    const blob = await composeFinal({
      capture: c.bitmap,
      captureWidth: c.width,
      captureHeight: c.height,
      mask: c.mask,
      background: backgroundImg,
      frame: null,
      stickers: [],
      cssFilter: 'none',
      edgeFeather: config.edgeFeather ?? 3,
    });
    session.setBlob(blob);
  };

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
      // Congelar el frame capturado en un ImageBitmap para que la cámara
      // (que sigue streaming en el fondo) no altere el bitmap original.
      const bitmap = await createImageBitmap(source);
      captureRef.current = {
        bitmap,
        mask: segResult.mask,
        width: captureWidth,
        height: captureHeight,
      };
      await recomposeBaseBlob(selectedBackgroundId);
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
    // En editor: recomponer con el nuevo bg.
    if (phase === 'editing') void recomposeBaseBlob(id);
  };

  const onSelectFrame = (id: string) =>
    setSelectedFrameId((prev) => (prev === id ? null : id));
  const onSelectFilter = (id: string) => setSelectedFilterId(id);

  const onAddSticker = (sticker: (typeof resolvedStickers)[number]) => {
    const instanceId = `${sticker.id}-${Date.now()}`;
    const w = sticker.defaultWidth ?? 180;
    setPlacedStickers((prev) => [
      ...prev,
      {
        instanceId,
        stickerId: sticker.id,
        src: sticker.resolvedImage,
        x: 313, // centro del photo area (626/2)
        y: 557, // centro (1114/2)
        width: w,
        height: w,
      },
    ]);
  };

  const onUpdateSticker = (id: string, patch: Partial<PlacedSticker>) => {
    setPlacedStickers((prev) =>
      prev.map((s) => (s.instanceId === id ? { ...s, ...patch } : s)),
    );
  };

  const onRemoveSticker = (id: string) => {
    setPlacedStickers((prev) => prev.filter((s) => s.instanceId !== id));
  };

  const handleRetake = () => {
    session.setBlob(null);
    captureRef.current?.bitmap?.close();
    captureRef.current = null;
    setPlacedStickers([]);
    setSelectedFrameId(null);
    setSelectedFilterId(filters[0]?.id ?? null);
    setPhase('live');
  };

  const handleShare = () => {
    setPhase('sharing');
    // TODO(Ola 5): composición final con frame + filter + stickers cocidos +
    // QR + modals de Email/Text.
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

      {/* Layer 2: header (solo fases con live cam visible) */}
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
          resolved={{
            backgrounds: resolvedBackgrounds,
            frames: resolvedFrames,
            filters,
            stickers: resolvedStickers,
          }}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          selectedBackgroundId={selectedBackgroundId}
          selectedFrameId={selectedFrameId}
          selectedFilterId={selectedFilterId}
          onSelectBackground={onSelectBackground}
          onSelectFrame={onSelectFrame}
          onSelectFilter={onSelectFilter}
          stickers={placedStickers}
          onAddSticker={onAddSticker}
          onUpdateSticker={onUpdateSticker}
          onRemoveSticker={onRemoveSticker}
          onBack={handleRetake}
          onShare={handleShare}
          labels={{
            tabs: {
              backgrounds: textos.tabBackgrounds,
              frames: textos.tabFrames,
              filters: textos.tabFilters,
            },
            ariaBack: textos.ariaBack,
            ariaShare: textos.ariaShare,
          }}
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
