'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useTextosMap } from '@/components/i18n-provider';
import { SendConfirmationPopup } from '@/components/listings/send-confirmation-popup';
import { SendToEmailModal } from '@/components/listings/send-to-email-modal';
import { SendToPhoneModal } from '@/components/listings/send-to-phone-modal';
import { useCamera } from '@/hooks/use-camera';
import { useCountdown } from '@/hooks/use-countdown';
import { usePhotoSession } from '@/hooks/use-photo-session';
import type { PhotoBoothConfig, PhotoBoothSticker } from '@/lib/config';
import { resolvePhotoBoothAsset } from '@/lib/photo-booth-asset';
import { composeFinal, type StickerPlacement } from '@/lib/photo-booth-compose';
import { segmentSelfie, warmupSegmenter } from '@/lib/photo-booth-segment';
import type { WeatherData } from '@/lib/weather';

import { CameraFeed, type CameraFeedHandle } from './capture/camera-feed';
import { PermissionGate } from './capture/permission-gate';
import type { EditorTab } from './editor/editor-tabs';
import type { PlacedSticker } from './editor/sticker-layer';
import { CountdownOverlay } from './screens/countdown-overlay';
import { EditorScreen } from './screens/editor-screen';
import { KioskHeader } from './screens/kiosk-header';
import { ShareScreen } from './screens/share-screen';
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
  shareTitle: string;
  shareEmailCta: string;
  shareTextCta: string;
  shareScanKicker: string;
  sentEmailTitle: string;
  sentEmailBody: string;
  sentPhoneTitle: string;
  sentPhoneBody: string;
  exitTitle: string;
  exitMessage: string;
  exitCancel: string;
  exitConfirm: string;
  experienceTeaserKicker: string;
  experienceTeaserTitle: string;
  experienceTeaserBody: string;
  experienceTeaserBack: string;
}

interface PhotoBoothModuleProps {
  config: PhotoBoothConfig;
  resolvedBackgrounds: Array<PhotoBoothConfig['backgrounds'][number] & { resolvedImage: string }>;
  resolvedFrames: Array<
    PhotoBoothConfig['frames'][number] & { resolvedImage: string; resolvedThumbnail: string }
  >;
  resolvedStickers: Array<PhotoBoothSticker & { resolvedImage: string }>;
  filters: PhotoBoothConfig['filters'];
  mockImageSrc: string;
  shareBackgroundSrc?: string;
  textos: PhotoBoothTextos;
  logoSrc: string;
  logoAlt: string;
  weather: WeatherData;
  locale: string;
  timezone?: string;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Si la imagen falla (red, CORS, 404), devolvemos null para que la
      // composición continúe sin background y no rompa el flujo.
      console.warn('[photo-booth] failed to load image:', src);
      resolve(null);
    };
    img.src = src;
  });
}

export function PhotoBoothModule({
  config: incomingConfig,
  resolvedBackgrounds: incomingBackgrounds,
  resolvedFrames: incomingFrames,
  resolvedStickers: incomingStickers,
  filters: incomingFilters,
  mockImageSrc,
  shareBackgroundSrc,
  textos: incomingTextos,
  logoSrc,
  logoAlt,
  weather,
  locale,
  timezone,
}: PhotoBoothModuleProps) {
  // Live override desde el Studio (S3.3). Si llega payload por postMessage,
  // re-componemos las listas resueltas con `resolvePhotoBoothAsset` (que ya
  // pasa-thru data: URLs sin tocar).
  const [override, setOverride] = useState<PhotoBoothConfig | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PhotoBoothConfig>).detail;
      if (
        detail &&
        Array.isArray(detail.backgrounds) &&
        Array.isArray(detail.filters)
      ) {
        setOverride(detail);
      }
    };
    window.addEventListener('kiosk:photo-booth-override', handler);
    return () => window.removeEventListener('kiosk:photo-booth-override', handler);
  }, []);

  const config = override ?? incomingConfig;
  const resolvedBackgrounds = useMemo(() => {
    if (!override) return incomingBackgrounds;
    return override.backgrounds.map((b) => ({
      ...b,
      resolvedImage: resolvePhotoBoothAsset(b.image),
    }));
  }, [override, incomingBackgrounds]);
  const resolvedFrames = useMemo(() => {
    if (!override) return incomingFrames;
    return override.frames.map((f) => ({
      ...f,
      resolvedImage: resolvePhotoBoothAsset(f.image),
      resolvedThumbnail: f.thumbnail
        ? resolvePhotoBoothAsset(f.thumbnail)
        : resolvePhotoBoothAsset(f.image),
    }));
  }, [override, incomingFrames]);
  const resolvedStickers = useMemo(() => {
    if (!override) return incomingStickers;
    return override.stickers.map((s) => ({
      ...s,
      resolvedImage: resolvePhotoBoothAsset(s.image),
    }));
  }, [override, incomingStickers]);
  const filters = override ? override.filters : incomingFilters;
  const live = useTextosMap();
  const pickPB = (key: string, fb: string) => live[key] ?? fb;
  const textos: PhotoBoothTextos = {
    timerOn: pickPB('photo_booth_timer_on', incomingTextos.timerOn),
    timerOff: pickPB('photo_booth_timer_off', incomingTextos.timerOff),
    experienceLabel: pickPB('photo_booth_start_cta', incomingTextos.experienceLabel),
    startLabel: pickPB('photo_booth_start_label', incomingTextos.startLabel),
    processing: pickPB('photo_booth_processing', incomingTextos.processing),
    permissionTitle: pickPB('photo_booth_permission_title', incomingTextos.permissionTitle),
    permissionBody: pickPB('photo_booth_permission_body', incomingTextos.permissionBody),
    permissionRetry: pickPB('photo_booth_permission_retry', incomingTextos.permissionRetry),
    ariaShutter: pickPB('photo_booth_aria_shutter', incomingTextos.ariaShutter),
    ariaHome: pickPB('photo_booth_aria_home', incomingTextos.ariaHome),
    ariaBack: pickPB('photo_booth_aria_back', incomingTextos.ariaBack),
    ariaClose: pickPB('photo_booth_aria_close', incomingTextos.ariaClose),
    ariaShare: pickPB('photo_booth_aria_share', incomingTextos.ariaShare),
    tabBackgrounds: pickPB('photo_booth_tab_backgrounds', incomingTextos.tabBackgrounds),
    tabFrames: pickPB('photo_booth_tab_frames', incomingTextos.tabFrames),
    tabFilters: pickPB('photo_booth_tab_filters', incomingTextos.tabFilters),
    shareTitle: pickPB('photo_booth_share_title', incomingTextos.shareTitle),
    shareEmailCta: pickPB('photo_booth_share_email_cta', incomingTextos.shareEmailCta),
    shareTextCta: pickPB('photo_booth_share_text_cta', incomingTextos.shareTextCta),
    shareScanKicker: pickPB('photo_booth_share_scan_kicker', incomingTextos.shareScanKicker),
    sentEmailTitle: pickPB('photo_booth_sent_email_title', incomingTextos.sentEmailTitle),
    sentEmailBody: pickPB('photo_booth_sent_email_body', incomingTextos.sentEmailBody),
    sentPhoneTitle: pickPB('photo_booth_sent_phone_title', incomingTextos.sentPhoneTitle),
    sentPhoneBody: pickPB('photo_booth_sent_phone_body', incomingTextos.sentPhoneBody),
    exitTitle: pickPB('photo_booth_exit_title', incomingTextos.exitTitle),
    exitMessage: pickPB('photo_booth_exit_message', incomingTextos.exitMessage),
    exitCancel: pickPB('photo_booth_exit_cancel', incomingTextos.exitCancel),
    exitConfirm: pickPB('photo_booth_exit_confirm', incomingTextos.exitConfirm),
    // experience teaser body tiene `{client_name}` interpolado en SSR — usar incoming
    experienceTeaserKicker: pickPB(
      'photo_booth_experience_kicker',
      incomingTextos.experienceTeaserKicker,
    ),
    experienceTeaserTitle: pickPB(
      'photo_booth_experience_title',
      incomingTextos.experienceTeaserTitle,
    ),
    experienceTeaserBody: incomingTextos.experienceTeaserBody,
    experienceTeaserBack: pickPB(
      'photo_booth_experience_back',
      incomingTextos.experienceTeaserBack,
    ),
  };
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
    resolvedBackgrounds.find((b) => b.id === 'none')?.id ?? resolvedBackgrounds[0]?.id ?? null,
  );
  const [, setHasTouchedBackground] = useState(false);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(
    resolvedFrames[0]?.id ?? null,
  );
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(filters[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<EditorTab>('backgrounds');
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showExperienceTeaser, setShowExperienceTeaser] = useState(false);

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
   * Recompone el blob con el background + frame actualmente seleccionados.
   * Usa el bitmap y mask cacheados en `captureRef`. Llamado tras la captura
   * inicial y cada vez que el usuario cambia de background o frame en el
   * editor. El frame se cuece en el blob (no es overlay DOM) — así la foto
   * exportada ya trae el frame incluido.
   */
  const recomposeBaseBlob = async (backgroundId: string | null, frameId: string | null) => {
    const c = captureRef.current;
    if (!c || !c.bitmap) return;
    const bg = resolvedBackgrounds.find((b) => b.id === backgroundId) ?? resolvedBackgrounds[0];
    const useOriginal = !bg || bg.image === '';
    const backgroundImg = !useOriginal && bg ? await loadImage(bg.resolvedImage) : null;
    const frame = resolvedFrames.find((f) => f.id === frameId && f.image !== '');
    const frameImg = frame ? await loadImage(frame.resolvedImage) : null;
    const blob = await composeFinal({
      capture: c.bitmap,
      captureWidth: c.width,
      captureHeight: c.height,
      mask: c.mask,
      background: backgroundImg,
      frame: frameImg,
      stickers: [],
      cssFilter: 'none',
      edgeFeather: config.edgeFeather ?? 3,
      keepOriginalBackground: useOriginal,
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
      await recomposeBaseBlob(selectedBackgroundId, selectedFrameId);
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
    // En editor: recomponer con el nuevo bg + frame actual.
    if (phase === 'editing') void recomposeBaseBlob(id, selectedFrameId);
  };

  const onSelectFrame = (id: string) => {
    setSelectedFrameId(id);
    // En editor: recomponer para cocer el nuevo frame en el blob.
    if (phase === 'editing') void recomposeBaseBlob(selectedBackgroundId, id);
  };
  const onSelectFilter = (id: string) => setSelectedFilterId(id);

  const onAddSticker = (
    sticker: (typeof resolvedStickers)[number],
    x: number,
    y: number,
  ) => {
    const instanceId = `${sticker.id}-${Date.now()}`;
    const w = sticker.defaultWidth ?? 180;
    setPlacedStickers((prev) => [
      ...prev,
      {
        instanceId,
        stickerId: sticker.id,
        src: sticker.resolvedImage,
        x,
        y,
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
    setSelectedFrameId(resolvedFrames[0]?.id ?? null);
    setSelectedFilterId(filters[0]?.id ?? null);
    setShowExitConfirm(false);
    // Si estamos en sharing → home (la sesión termina). En editing → live (retake).
    if (phase === 'sharing') {
      router.push('/home');
    } else {
      setPhase('live');
    }
  };

  const handleShare = async () => {
    setPhase('sharing');
    // Compone la imagen final con frame + filter + stickers cocidos.
    const c = captureRef.current;
    if (!c || !c.bitmap) return;
    try {
      const bg = resolvedBackgrounds.find((b) => b.id === selectedBackgroundId) ??
        resolvedBackgrounds[0];
      const useOriginal = !bg || bg.image === '';
      const backgroundImg =
        !useOriginal && bg ? await loadImage(bg.resolvedImage) : null;
      const frame = resolvedFrames.find(
        (f) => f.id === selectedFrameId && f.image !== '',
      );
      const frameImg = frame ? await loadImage(frame.resolvedImage) : null;
      const filter = filters.find((f) => f.id === selectedFilterId);
      // Resuelve imágenes de los stickers colocados (1080x1920 coords)
      const stickerPlacementsAll = await Promise.all(
        placedStickers.map(async (s) => {
          const img = await loadImage(s.src);
          if (!img) return null;
          const scaleX = 1080 / 626;
          const scaleY = 1920 / 1114;
          return {
            image: img,
            x: s.x * scaleX,
            y: s.y * scaleY,
            width: s.width * scaleX,
            height: s.height * scaleY,
            rotation: 0,
          };
        }),
      );
      const stickerPlacements: StickerPlacement[] = stickerPlacementsAll.filter(
        (s): s is StickerPlacement => s !== null,
      );
      const blob = await composeFinal({
        capture: c.bitmap,
        captureWidth: c.width,
        captureHeight: c.height,
        mask: c.mask,
        background: backgroundImg,
        frame: frameImg,
        stickers: stickerPlacements,
        cssFilter: filter?.cssFilter ?? 'none',
        edgeFeather: config.edgeFeather ?? 3,
        keepOriginalBackground: useOriginal,
      });
      session.setBlob(blob);
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Final compose failed');
    }
  };

  // Modales de envío: input real con teclado/numpad + popup confirmación.
  // El popup `SendConfirmationPopup` hace auto-redirect a /home a los 5s.
  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [confirm, setConfirm] = useState<
    { kind: 'email' | 'phone'; destination: string } | null
  >(null);

  const handleEmailSent = (email: string) => {
    setEmailOpen(false);
    setConfirm({ kind: 'email', destination: email });
  };
  const handlePhoneSent = (phone: string) => {
    setPhoneOpen(false);
    setConfirm({ kind: 'phone', destination: phone });
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

  const livePreviewFrame = resolvedFrames.find(
    (f) => f.id === selectedFrameId && f.image !== '',
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ width: 1080, height: 1920, background: 'hsl(var(--photo-bg))' }}
    >
      {/* Layer 1: live camera (visible durante live/countdown/capturing) */}
      {(phase === 'live' || phase === 'countdown' || phase === 'capturing') && (
        <>
          <CameraFeed
            ref={cameraRef}
            permission={camera.permission}
            stream={camera.stream}
            mockImageSrc={mockImageSrc}
            zoom={config.cameraZoom ?? 1}
          />
          {/* Overlay live del frame seleccionado: preview del marco sobre
              la cámara antes de la captura. */}
          {livePreviewFrame ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={livePreviewFrame.resolvedImage}
              alt=""
              draggable={false}
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: 1080,
                height: 1920,
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
            />
          ) : null}
        </>
      )}

      {/* Layer 2: header siempre visible (logo + weather + clock).
          Se renderiza superpuesto a la cámara en live/countdown/capturing,
          al top panel azul en editing y al fondo blanco en sharing. */}
      <KioskHeader weather={weather} locale={locale} timezone={timezone} />

      {/* Layer 3: fase activa */}
      {phase === 'live' && (
        <StartScreen
          frames={resolvedFrames}
          selectedFrameId={selectedFrameId}
          onSelectFrame={onSelectFrame}
          onStart={handleStart}
          onExperience={() => setShowExperienceTeaser(true)}
          onToggleTimer={handleToggleTimer}
          onHome={() => router.push('/home')}
          timerLabel={timerLabel}
          experienceLabel={textos.experienceLabel}
          startLabel={textos.startLabel}
          ariaHome={textos.ariaHome}
          ariaShutter={textos.ariaShutter}
        />
      )}

      {phase === 'countdown' && (
        <CountdownOverlay value={countdown.value} totalSeconds={timerSeconds > 0 ? timerSeconds : 3} />
      )}

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
          onBack={() => setShowExitConfirm(true)}
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

      {showExitConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 90 }}
        >
          <button
            type="button"
            aria-label={textos.exitCancel}
            onClick={() => setShowExitConfirm(false)}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', border: 'none' }}
          />
          <div
            className="relative flex flex-col items-center"
            style={{
              width: 720,
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: '52px 60px 48px',
              boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
              gap: 22,
            }}
          >
            <h3
              className="text-center font-sans"
              style={{
                fontSize: 38,
                lineHeight: 1.2,
                fontWeight: 700,
                color: 'hsl(var(--photo-home-btn-bg))',
                whiteSpace: 'pre-line',
              }}
            >
              {textos.exitTitle}
            </h3>
            <p
              className="text-center font-sans"
              style={{ fontSize: 22, lineHeight: 1.5, color: '#5a5a5a' }}
            >
              {textos.exitMessage}
            </p>
            <div className="mt-2 flex items-center justify-center" style={{ gap: 18 }}>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="font-sans focus:outline-none"
                style={{
                  height: 68,
                  minWidth: 200,
                  paddingInline: 34,
                  border: '2px solid #bfbfbf',
                  borderRadius: 999,
                  color: '#333',
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  backgroundColor: '#ffffff',
                }}
              >
                {textos.exitCancel}
              </button>
              <button
                type="button"
                onClick={handleRetake}
                className="font-sans text-white focus:outline-none"
                style={{
                  height: 68,
                  minWidth: 200,
                  paddingInline: 34,
                  borderRadius: 999,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  backgroundColor: '#d14343',
                  boxShadow: '0 10px 24px -6px rgba(209,67,67,0.5)',
                  border: 'none',
                }}
              >
                {textos.exitConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'sharing' && (
        <ShareScreen
          blobUrl={session.blobUrl}
          qrUrl={(config.shareUrlTemplate ?? 'https://example.com/{id}').replace(
            '{id}',
            `pb-${Date.now()}`,
          )}
          shareBackgroundSrc={shareBackgroundSrc}
          onBack={() => setPhase('editing')}
          onEmail={() => setEmailOpen(true)}
          onText={() => setPhoneOpen(true)}
          labels={{
            title: textos.shareTitle,
            emailCta: textos.shareEmailCta,
            textCta: textos.shareTextCta,
            scanKicker: textos.shareScanKicker,
            ariaBack: textos.ariaBack,
          }}
          logoSrc={logoSrc}
          logoAlt={logoAlt}
        />
      )}

      {/* Modales de envío reales — patrón compartido con listings/deals */}
      <SendToEmailModal
        open={emailOpen}
        listingTitle="Photo Booth"
        onCancel={() => setEmailOpen(false)}
        onSent={handleEmailSent}
      />
      <SendToPhoneModal
        open={phoneOpen}
        listingTitle="Photo Booth"
        onCancel={() => setPhoneOpen(false)}
        onSent={handlePhoneSent}
        onSwitchToKeyboard={() => {
          setPhoneOpen(false);
          setEmailOpen(true);
        }}
      />
      <SendConfirmationPopup
        open={confirm !== null}
        kind={confirm?.kind ?? 'email'}
        destination={confirm?.destination ?? ''}
        title={
          confirm?.kind === 'phone' ? textos.sentPhoneTitle : textos.sentEmailTitle
        }
        body={
          confirm?.kind === 'phone' ? textos.sentPhoneBody : textos.sentEmailBody
        }
        onClose={() => setConfirm(null)}
      />

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

      {showExperienceTeaser && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="absolute inset-0 flex items-center justify-center"
          style={{
            zIndex: 95,
            background:
              'radial-gradient(ellipse at center, rgba(7,12,30,0.85) 0%, rgba(0,0,0,0.96) 80%)',
          }}
        >
          <button
            type="button"
            aria-label={textos.exitCancel}
            onClick={() => setShowExperienceTeaser(false)}
            className="absolute inset-0"
            style={{ background: 'transparent', border: 'none' }}
          />
          <div
            className="relative flex flex-col items-center text-center"
            style={{ padding: '0 80px', gap: 24, color: '#fff', maxWidth: 880 }}
          >
            <div
              style={{
                fontFamily: "'Open Sans', system-ui",
                fontSize: 22,
                letterSpacing: '0.4em',
                color: 'hsl(var(--photo-countdown-ring))',
                textTransform: 'uppercase',
              }}
            >
              {textos.experienceTeaserKicker}
            </div>
            <h2
              style={{
                fontFamily: "'Montserrat', system-ui",
                fontSize: 120,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 0.95,
                background: 'linear-gradient(135deg, #fff 0%, hsl(var(--brand-tertiary)) 70%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
              }}
            >
              {textos.experienceTeaserTitle}
            </h2>
            <p
              style={{
                fontFamily: "'Open Sans', system-ui",
                fontSize: 28,
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.85)',
                maxWidth: 720,
              }}
            >
              {textos.experienceTeaserBody}
            </p>
            <button
              type="button"
              onClick={() => setShowExperienceTeaser(false)}
              style={{
                marginTop: 32,
                padding: '20px 56px',
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: "'Open Sans', system-ui",
                color: '#fff',
                background: 'transparent',
                border: '3px solid hsl(var(--photo-countdown-ring))',
                borderRadius: 9999,
                cursor: 'pointer',
                boxShadow: '0 0 40px hsl(var(--brand-tertiary) / 0.35)',
              }}
            >
              {textos.experienceTeaserBack}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
