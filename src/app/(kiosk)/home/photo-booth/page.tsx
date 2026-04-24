import { KioskCanvas } from '@/components/kiosk-canvas';
import { PhotoBoothModule } from '@/components/photo-booth/photo-booth-module';
import { getConfig } from '@/lib/config';
import { resolvePhotoBoothAsset } from '@/lib/photo-booth';
import { fetchWeather } from '@/lib/weather';

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
  const resolvedFrames = photoBooth.frames.map((f) => ({
    ...f,
    resolvedImage: resolvePhotoBoothAsset(f.image),
    resolvedThumbnail: f.thumbnail
      ? resolvePhotoBoothAsset(f.thumbnail)
      : resolvePhotoBoothAsset(f.image),
  }));
  const resolvedStickers = photoBooth.stickers.map((s) => ({
    ...s,
    resolvedImage: resolvePhotoBoothAsset(s.image),
  }));
  const mockImageSrc = resolvePhotoBoothAsset('assets/photo-booth/mock/demo-camera.jpg');
  const logoSrc = resolvePhotoBoothAsset(config.branding.logo.default);
  const logoAlt = config.branding.logo.alt ?? config.client.nombre;

  const coords = config.client.coords;
  const weather = await fetchWeather(coords?.lat, coords?.lng);
  const locale = config.client.locale ?? 'en-US';
  const timezone = config.client.timezone;

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
    ariaShare: config.textos.photo_booth_aria_share ?? 'Share photo',
    tabBackgrounds: config.textos.photo_booth_tab_backgrounds ?? 'Backgrounds',
    tabFrames: config.textos.photo_booth_tab_frames ?? 'Frames',
    tabFilters: config.textos.photo_booth_tab_filters ?? 'Filters',
    shareTitle: config.textos.photo_booth_share_title ?? 'SHARE YOUR MEMORIES',
    shareFollow: config.textos.photo_booth_share_follow ?? 'Follow us',
    shareScanMe: config.textos.photo_booth_share_scan_me ?? 'SCAN ME',
    shareEmailCta: config.textos.photo_booth_share_email_cta ?? 'EMAIL',
    shareTextCta: config.textos.photo_booth_share_text_cta ?? 'TEXT',
    sentTitle: config.textos.photo_booth_sent_title ?? 'Sent!',
    sentBody:
      config.textos.photo_booth_sent_body ?? 'Check your inbox in a few seconds.',
  };

  return (
    <KioskCanvas>
      <PhotoBoothModule
        config={photoBooth}
        resolvedBackgrounds={resolvedBackgrounds}
        resolvedFrames={resolvedFrames}
        resolvedStickers={resolvedStickers}
        filters={photoBooth.filters}
        mockImageSrc={mockImageSrc}
        textos={textos}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        weather={weather}
        locale={locale}
        timezone={timezone}
      />
    </KioskCanvas>
  );
}
