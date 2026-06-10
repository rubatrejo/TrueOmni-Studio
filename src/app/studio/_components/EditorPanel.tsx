'use client';

import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import { useState } from 'react';

import type {
  AdsModule,
  AiAvatarConfig,
  BillboardConfig,
  Branding,
  BrochuresModuleConfig,
  DealsModuleConfig,
  EventsModule,
  GuestbookConfig,
  I18nBundle,
  IntegrationsConfig,
  ItineraryBuilderConfig,
  ListingsModule,
  MapConfig,
  ModulesConfig,
  PassesModule,
  PhotoBoothConfig,
  SocialWallConfig,
  SurveyConfig,
  TicketsModule,
  TrailsModule,
} from '@/lib/studio/schema';

import { extractPaletteFromImage } from '../_lib/palette-from-image';
import { PRESET_PALETTES } from '../_lib/preset-palettes';
import { STUDIO_SECTIONS, VERSIONS_SECTION, type StudioSectionKey } from '../_lib/sections';

import { AdsEditor } from './AdsEditor';
import { AiAvatarEditor } from './AiAvatarEditor';
import { BillboardEditor } from './BillboardEditor';
import { BrochuresEditor } from './BrochuresEditor';
import { CustomFontField } from './CustomFontField';
import { DealsEditor } from './DealsEditor';
import { VersionsEditor } from './editor-panel/VersionsEditor';
import { EventsEditor } from './EventsEditor';
import { FontSelector } from './FontSelector';
import { GuestbookEditor } from './GuestbookEditor';
import { I18nEditor } from './I18nEditor';
import { ImageField } from './ImageField';
import { IntegrationsEditor } from './IntegrationsEditor';
import { ItineraryBuilderEditor } from './ItineraryBuilderEditor';
import { ListingsEditor } from './ListingsEditor';
import { MapEditor } from './MapEditor';
import { MediaField } from './MediaField';
import { HomeDashboardEditor, SystemModulesEditor } from './ModulesEditor';
import { PassesEditor } from './PassesEditor';
import { PhotoBoothEditor } from './PhotoBoothEditor';
import { SocialWallEditor } from './SocialWallEditor';
import { SurveyEditor } from './SurveyEditor';
import { TicketsEditor } from './TicketsEditor';
import { TrailsEditor } from './TrailsEditor';
import { ColorPicker } from './ui';

export function EditorPanel({
  sectionKey,
  branding,
  onBrandingChange,
  modules,
  onModulesChange,
  billboard,
  onBillboardChange,
  onBillboardPreview,
  onHomeDashboardPreview,
  aiAvatar,
  onAiAvatarChange,
  onAiAvatarPreview,
  survey,
  onSurveyChange,
  onSurveyPreview,
  deals,
  onDealsChange,
  onDealsPreview,
  photoBooth,
  onPhotoBoothChange,
  onPhotoBoothPreview,
  brochures,
  onBrochuresChange,
  onBrochuresPreview,
  socialWall,
  onSocialWallChange,
  onSocialWallPreview,
  guestbook,
  onGuestbookChange,
  onGuestbookPreview,
  listings,
  onListingsChange,
  events,
  onEventsChange,
  onEventsPreview,
  tickets,
  onTicketsChange,
  onTicketsPreview,
  passes,
  onPassesChange,
  onPassesPreview,
  trails,
  onTrailsChange,
  onTrailsPreview,
  map,
  onMapChange,
  onMapPreview,
  itinerary,
  onItineraryChange,
  onItineraryPreview,
  i18nBundle,
  onI18nBundleChange,
  ads,
  onAdsChange,
  integrations,
  onIntegrationsChange,
  currentVersion,
  lastPublishedAt,
  lastEditor,
  kioskLocation,
  onPublish,
  topSlot,
}: {
  sectionKey: StudioSectionKey;
  branding: Branding;
  onBrandingChange: (next: Branding) => void;
  modules: ModulesConfig;
  onModulesChange: (next: ModulesConfig) => void;
  billboard: BillboardConfig;
  onBillboardChange: (next: BillboardConfig) => void;
  onBillboardPreview: () => void;
  onHomeDashboardPreview: () => void;
  aiAvatar: AiAvatarConfig;
  onAiAvatarChange: (next: AiAvatarConfig) => void;
  onAiAvatarPreview: () => void;
  survey: SurveyConfig;
  onSurveyChange: (next: SurveyConfig) => void;
  onSurveyPreview: () => void;
  deals: DealsModuleConfig;
  onDealsChange: (next: DealsModuleConfig) => void;
  onDealsPreview: () => void;
  photoBooth: PhotoBoothConfig;
  onPhotoBoothChange: (next: PhotoBoothConfig) => void;
  onPhotoBoothPreview: () => void;
  brochures: BrochuresModuleConfig;
  onBrochuresChange: (next: BrochuresModuleConfig) => void;
  onBrochuresPreview: () => void;
  socialWall: SocialWallConfig;
  onSocialWallChange: (next: SocialWallConfig) => void;
  onSocialWallPreview: () => void;
  guestbook: GuestbookConfig;
  onGuestbookChange: (next: GuestbookConfig) => void;
  onGuestbookPreview: () => void;
  listings: ListingsModule;
  onListingsChange: (next: ListingsModule) => void;
  events: EventsModule;
  onEventsChange: (next: EventsModule) => void;
  onEventsPreview: () => void;
  tickets: TicketsModule;
  onTicketsChange: (next: TicketsModule) => void;
  onTicketsPreview: () => void;
  passes: PassesModule;
  onPassesChange: (next: PassesModule) => void;
  onPassesPreview: () => void;
  trails: TrailsModule;
  onTrailsChange: (next: TrailsModule) => void;
  onTrailsPreview: () => void;
  map: MapConfig;
  onMapChange: (next: MapConfig) => void;
  onMapPreview: () => void;
  itinerary: ItineraryBuilderConfig;
  onItineraryChange: (next: ItineraryBuilderConfig) => void;
  onItineraryPreview: () => void;
  i18nBundle: I18nBundle;
  onI18nBundleChange: (next: I18nBundle) => void;
  ads: AdsModule;
  onAdsChange: (next: AdsModule) => void;
  integrations: IntegrationsConfig;
  onIntegrationsChange: (next: IntegrationsConfig) => void;
  currentVersion: number;
  lastPublishedAt?: string;
  lastEditor?: string;
  /** Location del kiosk ("Davenport, FL"), usado por AI suggest (#26). */
  kioskLocation?: string;
  onPublish: () => void;
  /**
   * Contenido opcional renderizado dentro del scrollable area del panel
   * (encima del editor de la sección activa). Hallazgo S-21: el banner
   * "Branding sincronizado" antes vivía fuera del scroll y robaba altura
   * permanente; ahora viaja con el contenido y libera espacio del primer
   * Field en viewports cortos (<900px).
   */
  topSlot?: React.ReactNode;
}) {
  const section =
    sectionKey === 'versions'
      ? VERSIONS_SECTION
      : STUDIO_SECTIONS.find((s) => s.key === sectionKey)!;
  const isImplemented =
    sectionKey === 'branding' ||
    sectionKey === 'home-dashboard' ||
    sectionKey === 'modules' ||
    sectionKey === 'billboard' ||
    sectionKey === 'ai-avatar' ||
    sectionKey === 'survey' ||
    sectionKey === 'deals' ||
    sectionKey === 'photo-booth' ||
    sectionKey === 'digital-brochure' ||
    sectionKey === 'social-wall' ||
    sectionKey === 'guestbook' ||
    sectionKey === 'listings' ||
    sectionKey === 'events' ||
    sectionKey === 'tickets' ||
    sectionKey === 'passes' ||
    sectionKey === 'trails' ||
    sectionKey === 'map' ||
    sectionKey === 'itinerary-builder' ||
    sectionKey === 'i18n' ||
    sectionKey === 'ads' ||
    sectionKey === 'integrations' ||
    sectionKey === 'versions';

  const previewAction = getPreviewActionFor(sectionKey, {
    onBillboardPreview,
    onHomeDashboardPreview,
    onAiAvatarPreview,
    onSurveyPreview,
    onDealsPreview,
    onPhotoBoothPreview,
    onBrochuresPreview,
    onSocialWallPreview,
    onGuestbookPreview,
    onEventsPreview,
    onTicketsPreview,
    onPassesPreview,
    onTrailsPreview,
    onMapPreview,
    onItineraryPreview,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-200 px-6 py-5 dark:border-zinc-900">
        <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
          {section.title}
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          {section.description}
        </p>
        {previewAction && (
          <button
            type="button"
            onClick={previewAction.onClick}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[11.5px] font-medium text-sky-700 transition hover:bg-sky-500/20 dark:border-sky-400/30 dark:text-sky-300"
          >
            <Play className="h-3 w-3" />
            {previewAction.label}
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {topSlot}
        {sectionKey === 'branding' && (
          <BrandingEditor branding={branding} onChange={onBrandingChange} />
        )}
        {sectionKey === 'home-dashboard' && (
          <div className="space-y-6">
            {/* Hero header (background + gradient overlay) — movido aquí
                desde Branding (2026-05-18) porque solo afecta visualmente
                a la Home y a las module screens que heredan su background. */}
            <Group
              title="Hero header"
              hint="Background image or video for the Home Dashboard and module screens, plus the gradient overlay over it."
            >
              {branding.brandVideo?.src ? (
                <button
                  type="button"
                  onClick={() =>
                    onBrandingChange({
                      ...branding,
                      homeHero: { kind: 'video', src: branding.brandVideo!.src },
                    })
                  }
                  className="mb-2 inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:border-sky-800 dark:hover:bg-sky-950/60"
                  title="Use the client's brand video from Branding → Media"
                >
                  ▶ Use brand video
                </button>
              ) : null}
              <MediaField
                label="Drop image or video"
                hint="1080×620 recommended · JPG/PNG/WebP up to 5MB · MP4/WebM up to 2MB · paste a CDN URL below for larger videos"
                aspect="16/9"
                maxImageBytes={5 * 1024 * 1024}
                maxVideoBytes={2 * 1024 * 1024}
                value={branding.homeHero?.src || undefined}
                kind={branding.homeHero?.kind}
                onChange={(next) => {
                  if (!next) {
                    onBrandingChange({ ...branding, homeHero: undefined });
                    return;
                  }
                  onBrandingChange({
                    ...branding,
                    homeHero: { kind: next.kind, src: next.src },
                  });
                }}
              />
              <p className="mt-3 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                Gradient overlay
              </p>
              <p className="mb-1.5 text-[10.5px] text-zinc-500">
                Layer between the hero photo and the logo + clock so they remain readable. Use
                8-digit hex (#rrggbbAA) for transparency in the To color.
              </p>
              <HexRow
                label="From"
                value={branding.heroGradient?.from ?? '#004f8be6'}
                onChange={(v) =>
                  onBrandingChange({
                    ...branding,
                    heroGradient: {
                      from: v,
                      to: branding.heroGradient?.to ?? '#004f8b00',
                      angle: branding.heroGradient?.angle ?? 180,
                    },
                  })
                }
              />
              <HexRow
                label="To"
                value={branding.heroGradient?.to ?? '#004f8b00'}
                onChange={(v) =>
                  onBrandingChange({
                    ...branding,
                    heroGradient: {
                      from: branding.heroGradient?.from ?? '#004f8be6',
                      to: v,
                      angle: branding.heroGradient?.angle ?? 180,
                    },
                  })
                }
              />
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-zinc-700 dark:text-zinc-300">Angle</span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {branding.heroGradient?.angle ?? 180}°
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={branding.heroGradient?.angle ?? 180}
                  onChange={(e) =>
                    onBrandingChange({
                      ...branding,
                      heroGradient: {
                        from: branding.heroGradient?.from ?? '#004f8be6',
                        to: branding.heroGradient?.to ?? '#004f8b00',
                        angle: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-sky-500"
                  aria-label="Gradient angle"
                />
              </div>
              {branding.heroGradient ? (
                <button
                  type="button"
                  onClick={() => onBrandingChange({ ...branding, heroGradient: undefined })}
                  className="mt-1 text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline dark:hover:text-zinc-300"
                >
                  Reset gradient to default
                </button>
              ) : null}

              {/* Logo size — escala el slot del logo del hero header (default
                  M = 360×90), igual que el logo idle del Billboard. */}
              <p className="mt-3 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                Logo size
              </p>
              <p className="mb-1.5 text-[10.5px] text-zinc-500">
                Size of the client logo in the header.
              </p>
              <div
                role="radiogroup"
                aria-label="Hero logo size"
                className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                {(['S', 'M', 'L', 'XL'] as const).map((size) => {
                  const active = (branding.heroLogoSize ?? 'M') === size;
                  return (
                    <button
                      key={size}
                      role="radio"
                      aria-checked={active}
                      type="button"
                      onClick={() => onBrandingChange({ ...branding, heroLogoSize: size })}
                      className={
                        'rounded-md px-3.5 py-1 text-[11.5px] font-semibold transition ' +
                        (active
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                      }
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </Group>

            <HomeDashboardEditor modules={modules} listings={listings} onChange={onModulesChange} />
          </div>
        )}
        {sectionKey === 'modules' && (
          <SystemModulesEditor
            modules={modules}
            onChange={onModulesChange}
            listings={listings}
            onListingsChange={onListingsChange}
            itinerary={itinerary}
            onItineraryChange={onItineraryChange}
          />
        )}
        {sectionKey === 'billboard' && (
          <BillboardEditor
            billboard={billboard}
            onChange={onBillboardChange}
            modulesAvailable={modules.tiles.filter((t) => t.enabled && t.key !== 'wayfinding')}
            onBillboardPreview={onBillboardPreview}
            brandVideo={branding.brandVideo}
          />
        )}
        {sectionKey === 'ai-avatar' && (
          <AiAvatarEditor aiAvatar={aiAvatar} onChange={onAiAvatarChange} />
        )}
        {sectionKey === 'survey' && <SurveyEditor survey={survey} onChange={onSurveyChange} />}
        {sectionKey === 'deals' && (
          <DealsEditor deals={deals} onChange={onDealsChange} kioskLocation={kioskLocation ?? ''} />
        )}
        {sectionKey === 'photo-booth' && (
          <PhotoBoothEditor photoBooth={photoBooth} onChange={onPhotoBoothChange} />
        )}
        {sectionKey === 'digital-brochure' && (
          <BrochuresEditor brochures={brochures} onChange={onBrochuresChange} />
        )}
        {sectionKey === 'social-wall' && (
          <SocialWallEditor socialWall={socialWall} onChange={onSocialWallChange} />
        )}
        {sectionKey === 'guestbook' && (
          <GuestbookEditor guestbook={guestbook} onChange={onGuestbookChange} />
        )}
        {sectionKey === 'listings' && (
          <ListingsEditor
            value={listings}
            onChange={onListingsChange}
            kioskLocation={kioskLocation ?? ''}
          />
        )}
        {sectionKey === 'events' && (
          <EventsEditor
            value={events}
            onChange={onEventsChange}
            kioskLocation={kioskLocation ?? ''}
          />
        )}
        {sectionKey === 'tickets' && (
          <TicketsEditor value={tickets} eventsValue={events} onChange={onTicketsChange} />
        )}
        {sectionKey === 'passes' && <PassesEditor value={passes} onChange={onPassesChange} />}
        {sectionKey === 'trails' && (
          <TrailsEditor
            value={trails}
            onChange={onTrailsChange}
            mapboxToken={integrations.mapbox.token}
          />
        )}
        {sectionKey === 'map' && <MapEditor map={map} onChange={onMapChange} />}
        {sectionKey === 'itinerary-builder' && (
          <ItineraryBuilderEditor
            itinerary={itinerary}
            onChange={onItineraryChange}
            listings={listings}
            trails={trails}
            events={events}
          />
        )}
        {sectionKey === 'i18n' && <I18nEditor value={i18nBundle} onChange={onI18nBundleChange} />}
        {sectionKey === 'ads' && <AdsEditor value={ads} onChange={onAdsChange} />}
        {sectionKey === 'integrations' && (
          <IntegrationsEditor value={integrations} onChange={onIntegrationsChange} />
        )}
        {sectionKey === 'versions' && (
          <VersionsEditor
            currentVersion={currentVersion}
            lastPublishedAt={lastPublishedAt}
            lastEditor={lastEditor}
            onPublish={onPublish}
          />
        )}
        {!isImplemented && <ComingSoon section={section} />}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Branding editor                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

export function BrandingEditor({
  branding,
  onChange,
}: {
  branding: Branding;
  onChange: (next: Branding) => void;
}) {
  const setField = <K extends keyof Branding>(key: K, value: Branding[K]) =>
    onChange({ ...branding, [key]: value });

  const setFont = (slot: 'display' | 'body', font: string) =>
    onChange({ ...branding, fonts: { ...branding.fonts, [slot]: font } });

  const [suggestState, setSuggestState] = useState<'idle' | 'extracting' | 'error'>('idle');

  const handleSuggestPalette = async () => {
    const source = branding.logo ?? branding.idleLogo ?? branding.footerLogo;
    if (!source) {
      setSuggestState('error');
      setTimeout(() => setSuggestState('idle'), 2000);
      return;
    }
    setSuggestState('extracting');
    try {
      const palette = await extractPaletteFromImage(source);
      onChange({
        ...branding,
        primary: palette.primary,
        secondary: palette.secondary,
        tertiary: palette.tertiary,
      });
      setSuggestState('idle');
    } catch (err) {
      console.error('[Suggest palette]', err);
      setSuggestState('error');
      setTimeout(() => setSuggestState('idle'), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Brand colors */}
      <Group title="Brand colors" hint="3 tokens recolorize the entire kiosk.">
        <div className="space-y-2">
          <ColorRow
            label="Primary"
            description="Headers, toolbars, keyboard. The darkest brand tone."
            value={branding.primary}
            onChange={(v) => setField('primary', v)}
          />
          <ColorRow
            label="Secondary"
            description="Buttons, links, pins, focus ring. The action color."
            value={branding.secondary}
            onChange={(v) => setField('secondary', v)}
          />
          <ColorRow
            label="Tertiary"
            description="Highlights, featured CTAs, countdown ring."
            value={branding.tertiary}
            onChange={(v) => setField('tertiary', v)}
          />
        </div>

        <button
          type="button"
          onClick={handleSuggestPalette}
          disabled={suggestState === 'extracting'}
          className={
            'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] transition disabled:cursor-wait ' +
            (suggestState === 'error'
              ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'
              : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300')
          }
        >
          <Sparkles className="h-3.5 w-3.5" />
          {suggestState === 'extracting'
            ? 'Extracting palette…'
            : suggestState === 'error'
              ? 'Upload a logo first'
              : 'Suggest a palette from a logo'}
        </button>
      </Group>

      {/* Presets */}
      <Group title="Presets" hint="Apply a curated palette in one click.">
        <div className="grid grid-cols-3 gap-2">
          {PRESET_PALETTES.map((p) => (
            <button
              key={p.name}
              type="button"
              className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-2.5 text-left transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
              onClick={() =>
                onChange({
                  ...branding,
                  primary: p.primary,
                  secondary: p.secondary,
                  tertiary: p.tertiary,
                })
              }
            >
              <div className="mb-2 flex h-12 overflow-hidden rounded">
                <div className="flex-1" style={{ background: p.primary }} />
                <div className="flex-1" style={{ background: p.secondary }} />
                <div className="flex-1" style={{ background: p.tertiary }} />
              </div>
              <span className="block text-[11.5px] font-medium text-zinc-800 dark:text-zinc-200">
                {p.name}
              </span>
              <span className="block text-[10.5px] text-zinc-500">{p.tagline}</span>
            </button>
          ))}
        </div>
      </Group>

      {/* Logos */}
      <Group title="Logos" hint="SVG preferred. PNG fallback supported.">
        <div className="space-y-1.5">
          <ImageField
            layout="compact"
            label="Default logo"
            hint="Header & module screens · SVG · PNG"
            value={branding.logo}
            onChange={(v) => setField('logo', v)}
          />
          <ImageField
            layout="compact"
            label="Idle / Billboard logo"
            hint="Big logo on the idle screen · SVG · PNG"
            value={branding.idleLogo}
            onChange={(v) => setField('idleLogo', v)}
          />
          <ImageField
            layout="compact"
            label="Idle footer logo"
            hint="Bottom band of the idle screen · SVG · PNG"
            value={branding.footerLogo}
            onChange={(v) => setField('footerLogo', v)}
          />
          <ImageField
            layout="compact"
            label="Favicon"
            hint="SVG · PNG · ICO · 32×32+"
            value={branding.favicon}
            onChange={(v) => setField('favicon', v)}
            accept="image/svg+xml,image/png,image/x-icon,image/jpeg"
            maxBytes={100 * 1024}
          />
        </div>
      </Group>

      {/* El Hero header (background + gradient overlay) se editaba aquí
          en Branding hasta 2026-05-18. Movido al Home Dashboard editor
          porque visualmente solo aplica a la Home y a las module screens
          que la heredan — el operador esperaba encontrarlo ahí. La data
          sigue viviendo en `branding.homeHero` y `branding.heroGradient`. */}

      {/* Fonts */}
      <Group
        title="Typography"
        hint="Headings + body fonts. Google Fonts curated, or upload your own."
      >
        <FontSelector
          kind="Display"
          value={branding.fonts?.display ?? 'Montserrat'}
          onChange={(v) => setFont('display', v)}
        />
        <CustomFontField
          slot="display"
          value={branding.fonts?.displayCustom}
          onChange={(v) =>
            onChange({
              ...branding,
              fonts: { ...(branding.fonts ?? {}), displayCustom: v ?? undefined },
            })
          }
        />
        <div className="my-3 h-px bg-zinc-100 dark:bg-zinc-900" />
        <FontSelector
          kind="Body"
          value={branding.fonts?.body ?? 'Open Sans'}
          onChange={(v) => setFont('body', v)}
        />
        <CustomFontField
          slot="body"
          value={branding.fonts?.bodyCustom}
          onChange={(v) =>
            onChange({
              ...branding,
              fonts: { ...(branding.fonts ?? {}), bodyCustom: v ?? undefined },
            })
          }
        />
      </Group>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3">
        <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

function ColorRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2.5 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/30 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/60">
      <span className="flex flex-1 flex-col">
        <span className="text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
        <span className="text-[10.5px] leading-tight text-zinc-500">{description}</span>
      </span>
      <div className="w-40 shrink-0">
        <ColorPicker value={value} onChange={onChange} />
      </div>
    </div>
  );
}

// PRESET_PALETTES se movió a `_lib/preset-palettes.ts` (fuente única,
// también consumida por el server al aplicar un starter). Ver import arriba.

/* ────────────────────────────────────────────────────────────────────────── */

type PreviewHandlers = {
  onBillboardPreview: () => void;
  onHomeDashboardPreview: () => void;
  onAiAvatarPreview: () => void;
  onSurveyPreview: () => void;
  onDealsPreview: () => void;
  onPhotoBoothPreview: () => void;
  onBrochuresPreview: () => void;
  onSocialWallPreview: () => void;
  onGuestbookPreview: () => void;
  onEventsPreview: () => void;
  onTicketsPreview: () => void;
  onPassesPreview: () => void;
  onTrailsPreview: () => void;
  onMapPreview: () => void;
  onItineraryPreview: () => void;
};

/**
 * Mapea cada sección con un destino visible en el iframe del kiosk al
 * callback que lo dispara. Las secciones sin destino directo (Branding,
 * Modules, Listings, i18n, Ads, Integrations, Versions, Publish) devuelven
 * null y la cabecera no muestra el CTA.
 */
function getPreviewActionFor(
  sectionKey: StudioSectionKey,
  h: PreviewHandlers,
): { label: string; onClick: () => void } | null {
  switch (sectionKey) {
    case 'billboard':
      return { label: 'Open idle screen', onClick: h.onBillboardPreview };
    case 'home-dashboard':
      return { label: 'Open Home dashboard', onClick: h.onHomeDashboardPreview };
    case 'ai-avatar':
      return { label: 'Open AI Avatar', onClick: h.onAiAvatarPreview };
    case 'survey':
      return { label: 'Open Survey overlay', onClick: h.onSurveyPreview };
    case 'deals':
      return { label: 'Open Deals page', onClick: h.onDealsPreview };
    case 'photo-booth':
      return { label: 'Open Photo Booth', onClick: h.onPhotoBoothPreview };
    case 'digital-brochure':
      return { label: 'Open Brochures page', onClick: h.onBrochuresPreview };
    case 'social-wall':
      return { label: 'Open Social Wall', onClick: h.onSocialWallPreview };
    case 'guestbook':
      return { label: 'Open Guestbook', onClick: h.onGuestbookPreview };
    case 'events':
      return { label: 'Open Events page', onClick: h.onEventsPreview };
    case 'tickets':
      return { label: 'Open Tickets page', onClick: h.onTicketsPreview };
    case 'passes':
      return { label: 'Open Passes page', onClick: h.onPassesPreview };
    case 'trails':
      return { label: 'Open Trails page', onClick: h.onTrailsPreview };
    case 'map':
      return { label: 'Open Map page', onClick: h.onMapPreview };
    case 'itinerary-builder':
      return { label: 'Open Trip Planner', onClick: h.onItineraryPreview };
    default:
      return null;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Versions empty state                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function ComingSoon({ section }: { section: ReturnType<typeof STUDIO_SECTIONS.find> }) {
  if (!section) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col items-center justify-center text-center"
    >
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v4M12 18v4M22 12h-4M6 12H2M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83M19.07 19.07l-2.83-2.83M7.76 7.76L4.93 4.93" />
        </svg>
      </span>
      <h3 className="font-display text-base font-semibold text-zinc-700 dark:text-zinc-300">
        {section.label} editor lands in {section.phase}
      </h3>
      <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-zinc-500">
        {section.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500">
        Roadmap · {section.phase}
      </span>
    </motion.div>
  );
}

function HexRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="w-12 text-[11.5px] text-zinc-700 dark:text-zinc-300">{label}</span>
      <div className="flex-1">
        <ColorPicker value={value} onChange={onChange} allowAlpha placeholder="#004f8be6" />
      </div>
    </div>
  );
}
