'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useCamera } from '@/hooks/use-camera';
import { useCountdown } from '@/hooks/use-countdown';
import type { PhotoBoothConfig } from '@/lib/config';

import { CameraFeed, type CameraFeedHandle } from './capture/camera-feed';
import { PermissionGate } from './capture/permission-gate';
import { CountdownOverlay } from './screens/countdown-overlay';
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
 * Orquestador del módulo Photo Booth. La live camera y el header son
 * layers permanentes; cada fase renderiza su overlay específico encima.
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

  const [phase, setPhase] = useState<Phase>('live');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(
    resolvedBackgrounds[0]?.id ?? null,
  );
  const [hasTouchedBackground, setHasTouchedBackground] = useState(false);

  const timerOptions = config.timer?.options ?? [3, 5, 10];
  const timerDefault = config.timer?.default ?? 10;
  const timerEnabled = config.timer?.enabled !== false;
  const [timerSeconds, setTimerSeconds] = useState<number>(timerEnabled ? timerDefault : -1);

  useEffect(() => {
    void camera.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    if (phase !== 'live') return;
    if (timerSeconds > 0) {
      setPhase('countdown');
      countdown.start(timerSeconds, () => {
        setPhase('capturing');
        // TODO(Ola 3): capturar frame + segmentación → setPhase('editing')
      });
    } else {
      setPhase('capturing');
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
      {/* Layer 1: live camera (siempre presente) */}
      <CameraFeed
        ref={cameraRef}
        permission={camera.permission}
        stream={camera.stream}
        mockImageSrc={mockImageSrc}
      />

      {/* Layer 2: header (siempre presente excepto en sharing/editing que tienen su propio header) */}
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
    </div>
  );
}
