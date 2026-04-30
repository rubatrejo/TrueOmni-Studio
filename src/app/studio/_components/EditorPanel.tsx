'use client';

import { motion } from 'framer-motion';
import { History, Play, Rocket, Sparkles } from 'lucide-react';
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
  ListingsModule,
  ModulesConfig,
  PassesModule,
  PhotoBoothConfig,
  SocialWallConfig,
  SurveyConfig,
  TicketsModule,
  TrailsModule,
} from '@/lib/studio/schema';

import { extractPaletteFromImage } from '../_lib/palette-from-image';
import { STUDIO_SECTIONS, VERSIONS_SECTION, type StudioSectionKey } from '../_lib/sections';

import { AdsEditor } from './AdsEditor';
import { AiAvatarEditor } from './AiAvatarEditor';
import { BillboardEditor } from './BillboardEditor';
import { BrochuresEditor } from './BrochuresEditor';
import { CustomFontField } from './CustomFontField';
import { DealsEditor } from './DealsEditor';
import { EventsEditor } from './EventsEditor';
import { FontSelector } from './FontSelector';
import { GuestbookEditor } from './GuestbookEditor';
import { I18nEditor } from './I18nEditor';
import { ImageField } from './ImageField';
import { IntegrationsEditor } from './IntegrationsEditor';
import { ListingsEditor } from './ListingsEditor';
import { HomeDashboardEditor, SystemModulesEditor } from './ModulesEditor';
import { PassesEditor } from './PassesEditor';
import { PhotoBoothEditor } from './PhotoBoothEditor';
import { SocialWallEditor } from './SocialWallEditor';
import { SurveyEditor } from './SurveyEditor';
import { TicketsEditor } from './TicketsEditor';
import { TrailsEditor } from './TrailsEditor';

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
  i18nBundle,
  onI18nBundleChange,
  ads,
  onAdsChange,
  integrations,
  onIntegrationsChange,
  currentVersion,
  lastPublishedAt,
  lastEditor,
  onPublish,
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
  i18nBundle: I18nBundle;
  onI18nBundleChange: (next: I18nBundle) => void;
  ads: AdsModule;
  onAdsChange: (next: AdsModule) => void;
  integrations: IntegrationsConfig;
  onIntegrationsChange: (next: IntegrationsConfig) => void;
  currentVersion: number;
  lastPublishedAt?: string;
  lastEditor?: string;
  onPublish: () => void;
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
        {sectionKey === 'branding' && (
          <BrandingEditor branding={branding} onChange={onBrandingChange} />
        )}
        {sectionKey === 'home-dashboard' && (
          <HomeDashboardEditor modules={modules} onChange={onModulesChange} />
        )}
        {sectionKey === 'modules' && (
          <SystemModulesEditor
            modules={modules}
            onChange={onModulesChange}
            listings={listings}
            onListingsChange={onListingsChange}
          />
        )}
        {sectionKey === 'billboard' && (
          <BillboardEditor
            billboard={billboard}
            onChange={onBillboardChange}
            modulesAvailable={modules.tiles.filter((t) => t.enabled && t.key !== 'wayfinding')}
          />
        )}
        {sectionKey === 'ai-avatar' && (
          <AiAvatarEditor aiAvatar={aiAvatar} onChange={onAiAvatarChange} />
        )}
        {sectionKey === 'survey' && <SurveyEditor survey={survey} onChange={onSurveyChange} />}
        {sectionKey === 'deals' && <DealsEditor deals={deals} onChange={onDealsChange} />}
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
          <ListingsEditor value={listings} onChange={onListingsChange} />
        )}
        {sectionKey === 'events' && <EventsEditor value={events} onChange={onEventsChange} />}
        {sectionKey === 'tickets' && (
          <TicketsEditor value={tickets} eventsValue={events} onChange={onTicketsChange} />
        )}
        {sectionKey === 'passes' && <PassesEditor value={passes} onChange={onPassesChange} />}
        {sectionKey === 'trails' && <TrailsEditor value={trails} onChange={onTrailsChange} />}
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

function BrandingEditor({
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
    <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2.5 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/30 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/60">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-md ring-1 ring-zinc-300 dark:ring-zinc-800"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full cursor-pointer opacity-0"
          aria-label={`${label} color picker`}
        />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
        <span className="text-[10.5px] leading-tight text-zinc-500">{description}</span>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-right font-mono text-[11px] text-zinc-700 outline-none transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        spellCheck={false}
      />
    </label>
  );
}

const PRESET_PALETTES = [
  {
    name: 'TrueOmni',
    tagline: 'Tech Blue',
    primary: '#004F8B',
    secondary: '#0088CE',
    tertiary: '#B9BD39',
  },
  {
    name: 'Arizona',
    tagline: 'Desert',
    primary: '#5C2317',
    secondary: '#D2691E',
    tertiary: '#F4A460',
  },
  {
    name: 'Hotel Beach',
    tagline: 'Calm',
    primary: '#1E5F74',
    secondary: '#42B5D9',
    tertiary: '#FCD581',
  },
  {
    name: 'Forest',
    tagline: 'Nature',
    primary: '#173B30',
    secondary: '#3E885B',
    tertiary: '#E0C879',
  },
  {
    name: 'Mono',
    tagline: 'Editorial',
    primary: '#0A0A0A',
    secondary: '#404040',
    tertiary: '#FACC15',
  },
  {
    name: 'Sunset',
    tagline: 'Warm',
    primary: '#7C2D12',
    secondary: '#EA580C',
    tertiary: '#FCD34D',
  },
];

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
    default:
      return null;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Versions empty state                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function VersionsEditor({
  currentVersion,
  lastPublishedAt,
  lastEditor,
  onPublish,
}: {
  currentVersion: number;
  lastPublishedAt?: string;
  lastEditor?: string;
  onPublish: () => void;
}) {
  const hasPublished = currentVersion > 0;
  return (
    <div className="space-y-6">
      {/* Current version pill */}
      <section className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4 dark:border-zinc-900 dark:from-zinc-900/40 dark:to-zinc-900/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Current version
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
                v{currentVersion}
              </span>
              {!hasPublished && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  Draft
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">
              {hasPublished ? (
                <>
                  Last published{' '}
                  {lastPublishedAt ? (
                    <time dateTime={lastPublishedAt}>{relativeTime(lastPublishedAt)}</time>
                  ) : (
                    'recently'
                  )}
                  {lastEditor ? <> by {lastEditor.split('@')[0]}</> : null}.
                </>
              ) : (
                <>This kiosk has not been published yet. Hit Publish to ship v1.</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onPublish}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[12px] font-medium text-sky-700 transition hover:bg-sky-500/20 dark:border-sky-400/30 dark:text-sky-300"
          >
            <Rocket className="h-3.5 w-3.5" />
            Publish
          </button>
        </div>
      </section>

      {/* Empty state */}
      <section className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/40 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
          <History className="h-5 w-5" />
        </span>
        <h3 className="font-display text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Version history starts after your first publish
        </h3>
        <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          Each release will appear here as an immutable snapshot you can review, diff against the
          current draft, and roll back to with a single click. Coming with the next platform update.
        </p>
        <ul className="mt-5 space-y-1 text-left text-[11.5px] text-zinc-500 dark:text-zinc-500">
          <li>• Audit trail of every publish (who, when, what changed)</li>
          <li>• Side-by-side diff between any two versions</li>
          <li>• One-click rollback or pin a kiosk to a specific version</li>
          <li>• Auto-generated release notes</li>
        </ul>
      </section>
    </div>
  );
}

/** Devuelve "2 days ago" / "just now" para un ISO string. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'recently';
  const diff = Date.now() - then;
  if (diff < 60_000) return 'just now';
  const min = Math.round(diff / 60_000);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} ${day === 1 ? 'day' : 'days'} ago`;
  const month = Math.round(day / 30);
  if (month < 12) return `${month} mo ago`;
  return `${Math.round(month / 12)} yr ago`;
}

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
