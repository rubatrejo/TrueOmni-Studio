'use client';

import { Image as ImageIcon, Layers, Palette, Settings, Type } from 'lucide-react';
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { HslColorPicker, type HslColor } from 'react-colorful';

import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';

import { CustomFontField } from '../../_components/CustomFontField';
import { MediaField } from '../../_components/MediaField';
import { TabStrip, type TabStripItem } from '../../_components/TabStrip';
import { hexToHsl, hslToHex } from '../../digital-displays/_components/tabs/BrandingTab';

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

      {/* Active panel — altura fija 430px (≈30% menos que el 620 anterior),
          sin scroll. El contenido de cada tab se compactó para caber sin
          recortes: Logos con dropzones aspect 6:1 sin URL row, Media con
          aspect 3:2 y favicon más chico, etc. El flex justify-center
          centra el contenido cuando la suma natural es menor a 430px
          (Fonts, Brand colors) para no dejar hueco visible debajo. */}
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
                <Field label="Website">
                  <TextInput
                    value={value.website ?? ''}
                    onChange={(v) => setField('website', v)}
                    placeholder="https://"
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
          <Section title="Brand palette" hint="3 tokens recolor every product.">
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
          <Section title="Brand media" hint="Hero background and favicon icon.">
            <div className="grid grid-cols-[1fr_220px] gap-4">
              <MediaField
                label="Kiosk hero"
                hint="9:16 portrait — image or video, ≤5MB."
                aspect="3/2"
                slug={slug}
                value={value.homeHero?.src}
                kind={value.homeHero?.kind ?? 'image'}
                onChange={(next) =>
                  setField(
                    'homeHero',
                    next ? { kind: next.kind, src: next.src } : { kind: 'image', src: '' },
                  )
                }
              />
              <MediaField
                label="Favicon"
                hint="Square 1:1 — ICO, PNG or SVG."
                aspect="1/1"
                slug={slug}
                value={value.favicon}
                kind="image"
                hideUrlInput
                onChange={(next) => setField('favicon', next?.src ?? '')}
              />
            </div>
          </Section>
        ) : null}
      </div>
    </div>
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
  children,
}: {
  label: string;
  hint?: string;
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
        {hint ? (
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useContext(FieldIdContext) ?? undefined;
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[12.5px] text-zinc-800 outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
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
            onChange={(c) => onChange(`${Math.round(c.h)} ${Math.round(c.s)}% ${Math.round(c.l)}%`)}
          />
        ) : (
          <input
            type="text"
            value=""
            onChange={(e) => {
              const parsed = hexToHsl(e.target.value);
              if (parsed) {
                onChange(
                  `${Math.round(parsed.h)} ${Math.round(parsed.s)}% ${Math.round(parsed.l)}%`,
                );
              }
            }}
            placeholder="#RRGGBB"
            aria-label={`${label} hex value`}
            className="w-full rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] uppercase text-zinc-700 outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          />
        )}
      </div>
      {open && hsl ? (
        <div className="absolute right-2 top-12 z-20 rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <HslColorPicker
            color={hsl}
            onChange={(c: HslColor) =>
              onChange(`${Math.round(c.h)} ${Math.round(c.s)}% ${Math.round(c.l)}%`)
            }
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
  return { h: Math.round(Number(m[1])), s: Math.round(Number(m[2])), l: Math.round(Number(m[3])) };
}
