'use client';

import { Image as ImageIcon, Layers, Palette, Settings, Sparkles, Type } from 'lucide-react';
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { HslColorPicker, type HslColor } from 'react-colorful';

import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';
import { extractYouTubeId } from '@/lib/studio/youtube';

import { CustomFontField } from '../../_components/CustomFontField';
import { MediaField } from '../../_components/MediaField';
import { TabStrip, type TabStripItem } from '../../_components/TabStrip';
import { extractPaletteFromImage } from '../../_lib/palette-from-image';
import { hexToHsl, hslToHex, formatHsl } from '../../digital-displays/_components/tabs/BrandingTab';

// Hallazgo S-31: contexto del id del Field para que TextInput / FontSelect
// lean el id auto-generado y lo apliquen al input concreto. Antes el Field
// envolvía con `<label>` (válido HTML pero menos robusto en SR — VoiceOver
// con form controls anidados a veces no asocia el name correcto).
const FieldIdContext = createContext<string | null>(null);

/**
 * `<BrandingForm>` — unified branding editor with horizontal tabs.
 *
 * Five tabs at the top — General · Brand · Logos · Fonts · Media. Only one
 * section is rendered at a time so the operator can edit without scrolling.
 * Every change fires `onChange(next)` with the full branding object; the
 * caller debounces and persists via `PATCH /api/studio/clients/[slug]/branding`
 * (see ClientView).
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */
export interface BrandingFormProps {
  /** Slug del cliente — usado por MediaField/CustomFontField para subir
   *  assets a Blob storage con path `<product>/<slug>/...`. */
  slug: string;
  value: UnifiedClientBranding;
  onChange: (next: UnifiedClientBranding) => void;
}

type TabKey = 'general' | 'brand' | 'logos' | 'fonts' | 'media';

const TABS: ReadonlyArray<TabStripItem<TabKey>> = [
  { key: 'general', label: 'General', icon: Settings, title: 'Client metadata and location' },
  {
    key: 'brand',
    label: 'Brand colors',
    icon: Palette,
    title: 'Primary, secondary, accent and text/background tokens',
  },
  { key: 'logos', label: 'Logos', icon: Layers, title: 'Default and dark logo paths' },
  { key: 'fonts', label: 'Fonts', icon: Type, title: 'Display and body typefaces' },
  { key: 'media', label: 'Media', icon: ImageIcon, title: 'Hero image and brand video' },
];

const GOOGLE_FONTS = [
  'Montserrat',
  'Open Sans',
  'Inter',
  'Manrope',
  'Space Grotesk',
  'DM Sans',
  'Playfair Display',
  'Cormorant Garamond',
  'Outfit',
  'Geist',
];

export function BrandingForm({ slug, value, onChange }: BrandingFormProps) {
  const [tab, setTab] = useState<TabKey>('general');
  // Hallazgo S-15: TabStrip reutilizable + role=tablist. El idBase asocia
  // cada `<button role="tab">` con su `<div role="tabpanel">` por aria.
  const tabsId = useId();

  function setField<K extends keyof UnifiedClientBranding>(key: K, next: UnifiedClientBranding[K]) {
    onChange({ ...value, [key]: next });
  }

  // F-HUB-2: deriva la paleta desde el logo del cliente. `extractPaletteFromImage`
  // es client-side (canvas) y devuelve hex; los tokens del branding unificado son
  // HSL → convertimos con `hexToHsl` (ya importado para ColorRow).
  const [suggestState, setSuggestState] = useState<'idle' | 'extracting' | 'error'>('idle');
  const handleSuggestPalette = async () => {
    const source = value.logos.default || value.logos.idle || value.logos.footer;
    if (!source) {
      setSuggestState('error');
      setTimeout(() => setSuggestState('idle'), 2000);
      return;
    }
    setSuggestState('extracting');
    try {
      const palette = await extractPaletteFromImage(source);
      // `hexToHsl` devuelve un `HslColor` (objeto) o null ante un hex inválido;
      // lo serializamos con `formatHsl` al formato "H S% L%" que guardan los
      // tokens. Si es null conservamos el token previo.
      const toHsl = (hex: string, fallback: string): string => {
        const c = hexToHsl(hex);
        return c ? formatHsl(c) : fallback;
      };
      setField('brand', {
        ...value.brand,
        primary: toHsl(palette.primary, value.brand.primary),
        secondary: toHsl(palette.secondary, value.brand.secondary),
        accent: toHsl(palette.tertiary, value.brand.accent),
      });
      setSuggestState('idle');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Suggest palette]', err);
      setSuggestState('error');
      setTimeout(() => setSuggestState('idle'), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <TabStrip<TabKey>
        items={TABS}
        active={tab}
        onChange={setTab}
        idBase={tabsId}
        ariaLabel="Branding sections"
        className="px-3"
      />

      {/* Active panel — altura fija 430px para todos los tabs (incluido
          Media tras refactor 2026-05-18). El contenido del tab Media se
          reorganizó en una sola fila horizontal (Kiosk hero · Brand video
          · Favicon) con YouTube URL compacto debajo del Brand video para
          que entre sin crecer el card. */}
      <div
        role="tabpanel"
        id={`${tabsId}-panel-${tab}`}
        aria-labelledby={`${tabsId}-tab-${tab}`}
        className="flex h-[430px] flex-col justify-center p-6"
      >
        {tab === 'general' ? (
          // 2 secciones lógicas: Identity (Name + Website) + Location
          // (City + Lat/Lon). Antes 4 fields sueltos en 2-col grid leían
          // como una sopa de inputs sin jerarquía.
          <div className="space-y-5">
            <Section title="Identity" hint="Customer-facing name and main URL.">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <TextInput
                    value={value.name}
                    onChange={(v) => setField('name', v)}
                    placeholder="TrueOmni Theme"
                  />
                </Field>
                <Field
                  label="Website"
                  error={
                    // F-HUB-4: mismo guard de protocolo que el NewClientModal
                    // (antes el edit aceptaba texto libre, el create no).
                    value.website && !/^https?:\/\//i.test(value.website.trim())
                      ? 'Must start with http:// or https://'
                      : undefined
                  }
                >
                  <TextInput
                    value={value.website ?? ''}
                    onChange={(v) => setField('website', v)}
                    placeholder="https://"
                    invalid={!!value.website && !/^https?:\/\//i.test(value.website.trim())}
                  />
                </Field>
              </div>
            </Section>
            <Section title="Location" hint="Used by weather widget and maps.">
              <div className="grid grid-cols-[1fr_140px_140px] gap-3">
                <Field label="City">
                  <TextInput
                    value={value.location?.city ?? ''}
                    onChange={(v) => setField('location', { ...value.location, city: v })}
                    placeholder="Phoenix, AZ"
                  />
                </Field>
                <Field
                  label="Latitude"
                  hint={
                    value.location?.lat != null && Math.abs(value.location.lat) > 90
                      ? '⚠ Out of range'
                      : undefined
                  }
                >
                  <TextInput
                    value={value.location?.lat?.toString() ?? ''}
                    onChange={(v) => {
                      const num = v === '' ? undefined : Number(v);
                      if (v !== '' && Number.isNaN(num)) return;
                      const clamped = num != null ? Math.max(-90, Math.min(90, num)) : undefined;
                      setField('location', { ...value.location, lat: clamped });
                    }}
                    placeholder="33.4484"
                  />
                </Field>
                <Field
                  label="Longitude"
                  hint={
                    value.location?.lon != null && Math.abs(value.location.lon) > 180
                      ? '⚠ Out of range'
                      : undefined
                  }
                >
                  <TextInput
                    value={value.location?.lon?.toString() ?? ''}
                    onChange={(v) => {
                      const num = v === '' ? undefined : Number(v);
                      if (v !== '' && Number.isNaN(num)) return;
                      const clamped = num != null ? Math.max(-180, Math.min(180, num)) : undefined;
                      setField('location', { ...value.location, lon: clamped });
                    }}
                    placeholder="-112.0740"
                  />
                </Field>
              </div>
            </Section>
          </div>
        ) : null}

        {tab === 'brand' ? (
          // Cada ColorRow lleva descripción de su rol para que el operador
          // sepa qué cambia visualmente (antes era sólo "Primary/Secondary/
          // Accent/Neutral" sin contexto). 2x2 grid en desktop.
          <Section title="Brand palette" hint="These colors recolor every product.">
            <div className="grid grid-cols-2 gap-3">
              <ColorRow
                label="Primary"
                description="Buttons, headers, key CTAs."
                value={value.brand.primary}
                onChange={(v) => setField('brand', { ...value.brand, primary: v })}
              />
              <ColorRow
                label="Secondary"
                description="Supporting accents and panels."
                value={value.brand.secondary}
                onChange={(v) => setField('brand', { ...value.brand, secondary: v })}
              />
              <ColorRow
                label="Accent"
                description="Highlights, badges, selection."
                value={value.brand.accent}
                onChange={(v) => setField('brand', { ...value.brand, accent: v })}
              />
              <ColorRow
                label="Neutral"
                description="Backgrounds and surfaces."
                value={value.brand.neutral ?? '0 0% 7%'}
                onChange={(v) => setField('brand', { ...value.brand, neutral: v })}
              />
            </div>
            {/* F-HUB-2: derivar la paleta desde el logo del cliente. */}
            <button
              type="button"
              onClick={handleSuggestPalette}
              disabled={suggestState === 'extracting'}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {suggestState === 'extracting'
                ? 'Reading logo…'
                : suggestState === 'error'
                  ? 'No logo to read'
                  : 'Suggest palette from logo'}
            </button>
          </Section>
        ) : null}

        {tab === 'logos' ? (
          <Section
            title="Logo variants"
            hint="Default applies to every product. Other variants override per surface."
          >
            <div className="grid grid-cols-2 gap-3">
              <MediaField
                label="Default"
                hint="Used by every product."
                aspect="6/1"
                slug={slug}
                value={value.logos.default}
                kind="image"
                hideUrlInput
                onChange={(next) => setField('logos', { ...value.logos, default: next?.src ?? '' })}
              />
              <MediaField
                label="Dark"
                hint="For light backgrounds."
                aspect="6/1"
                slug={slug}
                value={value.logos.dark}
                kind="image"
                hideUrlInput
                onChange={(next) => setField('logos', { ...value.logos, dark: next?.src ?? '' })}
              />
              <MediaField
                label="Idle"
                hint="Big — Billboard idle screen."
                aspect="6/1"
                slug={slug}
                value={value.logos.idle}
                kind="image"
                hideUrlInput
                onChange={(next) => setField('logos', { ...value.logos, idle: next?.src ?? '' })}
              />
              <MediaField
                label="Footer"
                hint="Compact — footer band."
                aspect="6/1"
                slug={slug}
                value={value.logos.footer}
                kind="image"
                hideUrlInput
                onChange={(next) => setField('logos', { ...value.logos, footer: next?.src ?? '' })}
              />
            </div>
          </Section>
        ) : null}

        {tab === 'fonts' ? (
          <div className="space-y-4">
            <Section title="Typefaces" hint="Display for headlines, Body for paragraphs.">
              <div className="grid grid-cols-2 gap-3">
                <FontField
                  label="Display"
                  hint="Headlines, CTAs, big numbers."
                  preview="Aa"
                  value={value.fonts.display}
                  onChange={(v) => setField('fonts', { ...value.fonts, display: v })}
                />
                <FontField
                  label="Body"
                  hint="Paragraphs and supporting text."
                  preview="The quick brown fox jumps over."
                  value={value.fonts.body}
                  onChange={(v) => setField('fonts', { ...value.fonts, body: v })}
                />
              </div>
            </Section>
            <Section
              title="Custom upload"
              hint="Optional — overrides Google Font. .woff2 / .woff / .ttf / .otf · ≤600KB."
            >
              <div className="grid grid-cols-2 gap-3">
                <CustomFontField
                  slot="display"
                  value={value.fonts.displayCustom}
                  onChange={(next) =>
                    setField('fonts', { ...value.fonts, displayCustom: next ?? undefined })
                  }
                />
                <CustomFontField
                  slot="body"
                  value={value.fonts.bodyCustom}
                  onChange={(next) =>
                    setField('fonts', { ...value.fonts, bodyCustom: next ?? undefined })
                  }
                />
              </div>
            </Section>
          </div>
        ) : null}

        {tab === 'media' ? (
          // Layout horizontal compacto: 4 cards alineadas por arriba, cada
          // una con su título encima del dropzone (Kiosk hero · Idle
          // background · Brand video · Favicon). `items-start` mantiene el
          // alineamiento top aunque la altura natural de cada card sea
          // distinta. `aspectRatio` consistente 16:9 entre las 3 primeras
          // + 1:1 para favicon.
          <Section
            title="Brand media"
            hint="Hero, idle background, brand video and favicon — used across kiosk, displays and walls."
          >
            {/* Grid 4 columns. Aspect ratios reflejan el target real de
                cada media: Kiosk hero & Brand video 16:9 landscape, Idle
                background 9:16 portrait (kiosk 1080×1920), Favicon 1:1.
                La columna Favicon es ~120px (la mitad de las demás) para
                que se vea proporcional al contenido (icon ~32px) y no
                robe area visual. */}
            {/* Grid 4 cols con widths ajustadas para que el idle background
                9:16 entre en la altura disponible del panel sin estirarse:
                190px col → 190×16/9 ≈ 337px alto del idle (cabe en ~340px
                disponibles tras title+hint). Favicon 80px (1:1) ≈ 80px alto.
                Gap 5 (20px) entre cards para que se vean separadas. mx-auto
                centra el grid dentro del panel padre. */}
            <div className="mx-auto grid max-w-[680px] grid-cols-[190px_190px_190px_80px] items-start gap-5">
              <MediaCard title="Kiosk hero" hint="16:9 · image or video ≤5MB">
                <MediaField
                  label="Click or drop"
                  hint=""
                  aspect="16/9"
                  slug={slug}
                  value={value.homeHero?.src}
                  kind={value.homeHero?.kind ?? 'image'}
                  hideUrlInput
                  onChange={(next) =>
                    setField(
                      'homeHero',
                      next ? { kind: next.kind, src: next.src } : { kind: 'image', src: '' },
                    )
                  }
                />
              </MediaCard>
              <BrandMediaWithUrl
                title="Idle background"
                hint="9:16 · image, video or YouTube"
                aspect="9/16"
                slug={slug}
                value={
                  value.idleBackground
                    ? {
                        kind:
                          value.idleBackground.kind === 'image'
                            ? 'image'
                            : value.idleBackground.kind === 'youtube'
                              ? 'youtube'
                              : 'video',
                        src: value.idleBackground.src,
                      }
                    : undefined
                }
                allowImage
                onChange={(next) => {
                  if (!next) {
                    setField('idleBackground', undefined);
                    return;
                  }
                  const k = next.kind === 'image' || next.kind === 'youtube' ? next.kind : 'video';
                  setField('idleBackground', { kind: k, src: next.src });
                }}
              />
              <BrandMediaWithUrl
                title="Brand video"
                hint="MP4/WebM or YouTube · displays, walls, kiosk"
                aspect="16/9"
                slug={slug}
                value={
                  value.brandVideo
                    ? {
                        kind: value.brandVideo.kind === 'youtube' ? 'youtube' : 'video',
                        src: value.brandVideo.src,
                      }
                    : undefined
                }
                allowImage={false}
                onChange={(next) => {
                  if (!next) {
                    setField('brandVideo', undefined);
                    return;
                  }
                  const k = next.kind === 'youtube' ? 'youtube' : 'upload';
                  setField('brandVideo', { kind: k, src: next.src });
                }}
              />
              <MediaCard title="Favicon" hint="1:1 — ICO, PNG, SVG">
                <MediaField
                  label="Drop"
                  hint=""
                  aspect="1/1"
                  slug={slug}
                  value={value.favicon}
                  kind="image"
                  hideUrlInput
                  onChange={(next) => setField('favicon', next?.src ?? '')}
                />
              </MediaCard>
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Brand video field — upload (drag&drop) o URL de YouTube
// ---------------------------------------------------------------------------

/**
 * Shape genérico de un campo de Brand Media que soporta upload + YouTube
 * URL. `brandVideo` y `idleBackground` lo comparten (con kinds distintos).
 */
type BrandMediaValue =
  | { kind: 'image'; src: string }
  | { kind: 'video'; src: string }
  | { kind: 'youtube'; src: string };

/**
 * `<MediaCard>` — wrapper visual uniforme: título 12px arriba, contenido
 * (dropzone) en el centro, hint debajo. Garantiza que todas las cards del
 * grid del tab Media estén alineadas por arriba y tengan el mismo título
 * en la misma posición.
 */
function MediaCard({
  title,
  hint,
  rightAction,
  children,
}: {
  title: string;
  hint?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-5 items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">{title}</span>
        {rightAction}
      </div>
      {children}
      {hint ? <p className="text-[10px] text-zinc-500 dark:text-zinc-500">{hint}</p> : null}
    </div>
  );
}

/**
 * `<BrandMediaWithUrl>` — card que combina upload (drag&drop) + YouTube
 * URL en un mismo footprint. Toggle "YouTube URL" / "Use upload" para
 * alternar entre los dos modos sin crecer verticalmente. Compartido por
 * Idle background (allowImage=true) y Brand video (allowImage=false).
 */
function BrandMediaWithUrl({
  title,
  hint,
  aspect = '16/9',
  slug,
  value,
  allowImage,
  onChange,
}: {
  title: string;
  hint?: string;
  /** CSS aspect-ratio del dropzone y del thumbnail YouTube. */
  aspect?: string;
  slug: string;
  value: BrandMediaValue | undefined;
  /** True para Idle background (acepta imágenes). False para Brand video. */
  allowImage: boolean;
  onChange: (next: BrandMediaValue | undefined) => void;
}) {
  const [showYouTube, setShowYouTube] = useState(value?.kind === 'youtube');
  const [youtubeInput, setYoutubeInput] = useState(value?.kind === 'youtube' ? value.src : '');
  const youtubeId = value?.kind === 'youtube' ? extractYouTubeId(value.src) : null;

  const toggleButton = (
    <button
      type="button"
      onClick={() => {
        setShowYouTube((s) => {
          const next = !s;
          if (!next && value?.kind === 'youtube') {
            setYoutubeInput('');
            onChange(undefined);
          }
          return next;
        });
      }}
      className={
        showYouTube
          ? 'text-[10.5px] text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline dark:hover:text-zinc-300'
          : 'text-[10.5px] text-sky-600 underline-offset-2 hover:text-sky-700 hover:underline dark:text-sky-400 dark:hover:text-sky-300'
      }
    >
      {showYouTube ? 'Use upload' : 'YouTube URL'}
    </button>
  );

  if (showYouTube) {
    return (
      <MediaCard title={title} hint={hint} rightAction={toggleButton}>
        <div
          className="relative grid place-items-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-900/40"
          style={{ aspectRatio: aspect }}
        >
          {youtubeId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              loading="lazy"
              src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-3 text-center text-[10.5px] text-zinc-500">Paste YouTube URL</span>
          )}
        </div>
        <input
          type="url"
          value={youtubeInput}
          onChange={(e) => {
            const next = e.target.value;
            setYoutubeInput(next);
            if (extractYouTubeId(next)) {
              onChange({ kind: 'youtube', src: next.trim() });
            } else if (value?.kind === 'youtube') {
              onChange(undefined);
            }
          }}
          placeholder="https://youtu.be/…"
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
        />
      </MediaCard>
    );
  }

  // Upload mode. Idle background acepta image+video; Brand video solo
  // video. El kind 'youtube' se filtra (modo URL gestionado arriba).
  const isUpload = value?.kind === 'image' || value?.kind === 'video';
  const mediaSrc = isUpload ? value!.src : undefined;
  const mediaKind: 'image' | 'video' = value?.kind === 'image' ? 'image' : 'video';

  return (
    <MediaCard title={title} hint={hint} rightAction={toggleButton}>
      <MediaField
        label={allowImage ? 'Click or drop' : 'Drop video'}
        hint=""
        aspect={aspect}
        slug={slug}
        value={mediaSrc}
        kind={mediaKind}
        hideUrlInput
        maxVideoBytes={2 * 1024 * 1024}
        onChange={(next) => {
          if (!next) {
            onChange(undefined);
            return;
          }
          // Idle background y Brand video: usamos 'image' | 'video' del
          // MediaField. El upper-layer mapea 'video' → 'upload' para el
          // shape específico de brandVideo. allowImage solo afecta qué
          // tipos de archivo acepta visualmente; el shape interno es el
          // mismo.
          onChange({ kind: next.kind, src: next.src });
        }}
      />
    </MediaCard>
  );
}

// ---------------------------------------------------------------------------
//  Primitives
// ---------------------------------------------------------------------------

/**
 * `<Section>` — encabezado pequeño + bloque de contenido. Da jerarquía
 * visual a cada tab del BrandingForm sin gastar mucho alto vertical
 * (label 13px + hint 11px ≈ 32px de cabecera).
 */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-white">{title}</h3>
        {hint ? <span className="text-[11px] text-zinc-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  /** Mensaje de error (rojo, prevalece sobre hint cuando está set). */
  error?: string;
  children: React.ReactNode;
}) {
  // Hallazgo S-31: id auto-generado + htmlFor explícito. Los hijos
  // (TextInput / FontSelect) leen el id del FieldIdContext.
  const fieldId = useId();
  const hintId = hint ? `${fieldId}-hint` : undefined;
  return (
    <FieldIdContext.Provider value={fieldId}>
      <div className="flex flex-col gap-1.5 text-[12.5px]">
        <label htmlFor={fieldId} className="font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        {children}
        {error ? (
          <span className="text-[11px] text-rose-600 dark:text-rose-400">{error}</span>
        ) : hint ? (
          <span id={hintId} className="text-[11px] text-zinc-500">
            {hint}
          </span>
        ) : null}
      </div>
    </FieldIdContext.Provider>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const id = useContext(FieldIdContext) ?? undefined;
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-9 w-full rounded-md border bg-white px-2.5 text-[12.5px] text-zinc-800 outline-none transition dark:bg-zinc-950 dark:text-zinc-200 ${
        invalid
          ? 'border-rose-400 focus:border-rose-500'
          : 'border-zinc-200 focus:border-sky-400 dark:border-zinc-800'
      }`}
    />
  );
}

function FontSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useContext(FieldIdContext) ?? undefined;
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[12.5px] outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
    >
      {GOOGLE_FONTS.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  );
}

/**
 * `<FontField>` — combo de selector + preview. El preview renderea el
 * texto con la font seleccionada para que el operador vea cómo se
 * verán los headlines / body antes de guardar.
 *
 * Carga el font de Google al vuelo (`<link>` inyectado al `<head>`).
 */
function FontField({
  label,
  hint,
  preview,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  preview: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Inyecta el `<link>` de Google Fonts para el font seleccionado.
  // Cada cambio de font añade un nuevo link (browser deduplica por href).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const family = value.replace(/\s+/g, '+');
    const href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;600&display=swap`;
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [value]);

  const fieldId = useId();
  return (
    <FieldIdContext.Provider value={fieldId}>
      <div className="flex flex-col gap-1.5 text-[12.5px]">
        <label htmlFor={fieldId} className="font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        <FontSelect value={value} onChange={onChange} />
        <div
          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100"
          style={{ fontFamily: `"${value}", system-ui, sans-serif` }}
        >
          <span className="text-[18px] font-semibold leading-tight">{preview}</span>
        </div>
        <span className="text-[11px] text-zinc-500">{hint}</span>
      </div>
    </FieldIdContext.Provider>
  );
}

function ColorRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  /** Texto corto bajo el label explicando dónde se usa este color. */
  description?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hsl = parseHsl(value);
  // S-17: click-outside / Escape cierran el picker. Antes solo "Done" o
  // re-toggle del swatch lo cerraban — el operador no tenía pista.
  const popoverRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    // setTimeout para no capturar el mismo click que abrió el picker.
    const id = setTimeout(() => {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div
      ref={popoverRef}
      className="relative flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </span>
          {description ? (
            <span className="block text-[11px] leading-snug text-zinc-500">{description}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? 'Close' : 'Open'} ${label} picker`}
          className="h-9 w-9 shrink-0 rounded-md border border-zinc-200 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-zinc-800"
          style={{ backgroundColor: hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '#888' }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] text-zinc-700 outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          placeholder="H S% L%"
          aria-label={`${label} HSL value`}
        />
        {hsl ? (
          <HexInput
            hsl={hsl}
            ariaLabel={`${label} hex value`}
            onChange={(c) => onChange(formatHsl(c))}
          />
        ) : (
          <input
            type="text"
            value=""
            onChange={(e) => {
              const parsed = hexToHsl(e.target.value);
              if (parsed) {
                onChange(formatHsl(parsed));
              }
            }}
            placeholder="#RRGGBB"
            aria-label={`${label} hex value`}
            className="w-full rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] uppercase text-zinc-700 outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          />
        )}
      </div>
      {open && hsl ? (
        // Picker abre HACIA ARRIBA (`bottom-full mb-2`) en lugar de hacia
        // abajo (`top-12`). Antes el picker del color Tertiary (último
        // del grid) overflowed por debajo del card padre `h-[430px]` y
        // quedaba parcialmente fuera. Abrir hacia arriba garantiza que
        // siempre quepa porque hay más espacio sobre el swatch (header
        // + tabs) que debajo (al estar el Tertiary cerca del bottom).
        <div className="absolute bottom-full right-0 z-20 mb-2 rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <HslColorPicker
            color={hsl}
            onChange={(c: HslColor) => onChange(formatHsl(c))}
            style={{ width: 200, height: 150 }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * `<HexInput>` — input controlado que muestra el HSL como #RRGGBB y actualiza
 * el HSL parent cuando el operator pega un hex válido. Sincroniza el draft
 * cuando el HSL externo cambia (picker, reset, HSL input paralelo).
 */
function HexInput({
  hsl,
  onChange,
  ariaLabel,
}: {
  hsl: HslColor;
  onChange: (c: HslColor) => void;
  ariaLabel: string;
}) {
  const computed = hslToHex(hsl);
  const [draft, setDraft] = useState(computed);
  const lastSyncRef = useRef(computed);
  if (computed !== lastSyncRef.current) {
    lastSyncRef.current = computed;
    setDraft(computed);
  }
  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        const parsed = hexToHsl(v);
        if (parsed) onChange(parsed);
      }}
      onBlur={() => {
        if (!hexToHsl(draft)) setDraft(computed);
      }}
      placeholder="#RRGGBB"
      aria-label={ariaLabel}
      className="w-full rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] uppercase text-zinc-700 outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
    />
  );
}

function parseHsl(value: string): HslColor | null {
  const m = value.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}
