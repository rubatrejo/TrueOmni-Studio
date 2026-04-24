import { KioskCanvas } from '@/components/kiosk-canvas';
import { PhotoBoothModule } from '@/components/photo-booth/photo-booth-module';
import { getConfig } from '@/lib/config';
import { resolvePhotoBoothAsset } from '@/lib/photo-booth';

export default async function PhotoBoothPage() {
  const config = await getConfig();
  const photoBooth = config.features?.home?.photoBooth;

  if (!photoBooth || !photoBooth.enabled) {
    return (
      <KioskCanvas>
        <div className="p-12 text-center text-xl font-semibold text-gray-700">
          {config.textos.photo_booth_disabled ??
            'Photo Booth is not configured for the active client.'}
        </div>
      </KioskCanvas>
    );
  }

  const resolvedBackgrounds = photoBooth.backgrounds.map((b) => ({
    ...b,
    resolvedImage: resolvePhotoBoothAsset(b.image),
  }));
  const mockImageSrc = resolvePhotoBoothAsset('assets/photo-booth/mock/demo-camera.jpg');
  const logoSrc = resolvePhotoBoothAsset(config.branding.logo.default);
  const logoAlt = config.branding.logo.alt ?? config.client.nombre;

  // Header time + date derivados de `new Date()` SSR, formateados con el
  // locale y timezone del cliente. El reloj no se actualiza en cliente en
  // v1; Fase 5+ conectará un `<LiveClock>` que refresque cada minuto.
  const now = new Date();
  const locale = config.client.locale ?? 'en-US';
  const timezone = config.client.timezone;
  const headerTime = now.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
  const headerDate = now.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  });
  const headerTempLabel = config.textos.photo_booth_header_temp_placeholder ?? '50°';

  const textos = {
    timerOn: config.textos.photo_booth_timer_on ?? 'TIMER {seconds}s',
    timerOff: config.textos.photo_booth_timer_off ?? 'TIMER OFF',
    startLabel: config.textos.photo_booth_start_label ?? 'START',
    experienceLabel: config.textos.photo_booth_start_cta ?? 'EXPERIENCE',
    permissionTitle: config.textos.photo_booth_permission_title ?? 'Camera access needed',
    permissionBody:
      config.textos.photo_booth_permission_body ??
      'Allow camera access to take your photo.',
    permissionRetry: config.textos.photo_booth_permission_retry ?? 'Try again',
    processing: config.textos.photo_booth_processing ?? 'Processing…',
    ariaHome: config.textos.photo_booth_aria_home ?? 'Go home',
    ariaShutter: config.textos.photo_booth_aria_shutter ?? 'Take photo',
    ariaBack: config.textos.photo_booth_aria_back ?? 'Go back',
    ariaClose: config.textos.photo_booth_aria_close ?? 'Close',
  };

  return (
    <KioskCanvas>
      <PhotoBoothModule
        config={photoBooth}
        resolvedBackgrounds={resolvedBackgrounds}
        mockImageSrc={mockImageSrc}
        textos={textos}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        headerTime={headerTime}
        headerDate={headerDate}
        headerTempLabel={headerTempLabel}
      />
    </KioskCanvas>
  );
}
