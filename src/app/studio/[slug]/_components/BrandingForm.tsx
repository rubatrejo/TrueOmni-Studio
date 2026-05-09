'use client';

import { Image as ImageIcon, Layers, Palette, Settings, Type } from 'lucide-react';
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { HslColorPicker, type HslColor } from 'react-colorful';

import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';

import { TabStrip, type TabStripItem } from '../../_components/TabStrip';

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

export function BrandingForm({ value, onChange }: BrandingFormProps) {
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

      {/* Active panel */}
      <div
        role="tabpanel"
        id={`${tabsId}-panel-${tab}`}
        aria-labelledby={`${tabsId}-tab-${tab}`}
        className="p-6"
      >
        {tab === 'general' ? (
          <Panel>
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
            <Field label="City">
              <TextInput
                value={value.location?.city ?? ''}
                onChange={(v) => setField('location', { ...value.location, city: v })}
                placeholder="Phoenix, AZ"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Latitude"
                hint={
                  value.location?.lat != null && Math.abs(value.location.lat) > 90
                    ? '⚠ Out of range (-90 to 90)'
                    : undefined
                }
              >
                <TextInput
                  value={value.location?.lat?.toString() ?? ''}
                  onChange={(v) => {
                    const num = v === '' ? undefined : Number(v);
                    if (v !== '' && Number.isNaN(num)) return;
                    // S-18: clamp suave a rango válido de latitud.
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
                    ? '⚠ Out of range (-180 to 180)'
                    : undefined
                }
              >
                <TextInput
                  value={value.location?.lon?.toString() ?? ''}
                  onChange={(v) => {
                    const num = v === '' ? undefined : Number(v);
                    if (v !== '' && Number.isNaN(num)) return;
                    // S-18: clamp suave a rango válido de longitud.
                    const clamped = num != null ? Math.max(-180, Math.min(180, num)) : undefined;
                    setField('location', { ...value.location, lon: clamped });
                  }}
                  placeholder="-112.0740"
                />
              </Field>
            </div>
          </Panel>
        ) : null}

        {tab === 'brand' ? (
          <Panel>
            <ColorRow
              label="Primary"
              value={value.brand.primary}
              onChange={(v) => setField('brand', { ...value.brand, primary: v })}
            />
            <ColorRow
              label="Secondary"
              value={value.brand.secondary}
              onChange={(v) => setField('brand', { ...value.brand, secondary: v })}
            />
            <ColorRow
              label="Accent"
              value={value.brand.accent}
              onChange={(v) => setField('brand', { ...value.brand, accent: v })}
            />
            <ColorRow
              label="Neutral"
              value={value.brand.neutral ?? '0 0% 7%'}
              onChange={(v) => setField('brand', { ...value.brand, neutral: v })}
            />
          </Panel>
        ) : null}

        {tab === 'logos' ? (
          <Panel>
            <Field label="Default" hint="Main logo — used by every product.">
              <TextInput
                value={value.logos.default ?? ''}
                onChange={(v) => setField('logos', { ...value.logos, default: v })}
                placeholder="assets/logo.svg or https://..."
              />
            </Field>
            <Field
              label="Dark"
              hint="Variant for light backgrounds (signage). Falls back to default if empty."
            >
              <TextInput
                value={value.logos.dark ?? ''}
                onChange={(v) => setField('logos', { ...value.logos, dark: v })}
                placeholder="assets/logo-dark.svg"
              />
            </Field>
            <Field label="Idle" hint="Large variant for the kiosk Billboard idle screen.">
              <TextInput
                value={value.logos.idle ?? ''}
                onChange={(v) => setField('logos', { ...value.logos, idle: v })}
                placeholder="assets/logo-idle.svg"
              />
            </Field>
            <Field label="Footer" hint="Compact variant for the kiosk footer band.">
              <TextInput
                value={value.logos.footer ?? ''}
                onChange={(v) => setField('logos', { ...value.logos, footer: v })}
                placeholder="assets/logo-footer.svg"
              />
            </Field>
          </Panel>
        ) : null}

        {tab === 'fonts' ? (
          <Panel>
            <Field label="Display font" hint="Used for headlines, CTAs and large numbers.">
              <FontSelect
                value={value.fonts.display}
                onChange={(v) => setField('fonts', { ...value.fonts, display: v })}
              />
            </Field>
            <Field label="Body font" hint="Used for body copy and supporting text.">
              <FontSelect
                value={value.fonts.body}
                onChange={(v) => setField('fonts', { ...value.fonts, body: v })}
              />
            </Field>
          </Panel>
        ) : null}

        {tab === 'media' ? (
          <Panel>
            <Field label="Kiosk hero kind">
              <select
                value={value.homeHero?.kind ?? 'image'}
                onChange={(e) =>
                  setField('homeHero', {
                    kind: e.target.value as 'image' | 'video',
                    src: value.homeHero?.src ?? '',
                  })
                }
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[12.5px] outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </Field>
            <Field label="Kiosk hero URL">
              <TextInput
                value={value.homeHero?.src ?? ''}
                onChange={(v) =>
                  setField('homeHero', { kind: value.homeHero?.kind ?? 'image', src: v })
                }
                placeholder="assets/home/hero.jpg or https://...mp4"
              />
            </Field>
            <Field label="Favicon">
              <TextInput
                value={value.favicon ?? ''}
                onChange={(v) => setField('favicon', v)}
                placeholder="assets/favicon.ico"
              />
            </Field>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Primitives
// ---------------------------------------------------------------------------

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
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

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
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
      className="relative flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <span className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? 'Close' : 'Open'} ${label} picker`}
          className="h-7 w-7 rounded border border-zinc-200 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-zinc-800"
          style={{ backgroundColor: hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '#888' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] text-zinc-700 outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          placeholder="H S% L%"
        />
      </span>
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

function parseHsl(value: string): HslColor | null {
  const m = value.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  return { h: Math.round(Number(m[1])), s: Math.round(Number(m[2])), l: Math.round(Number(m[3])) };
}
