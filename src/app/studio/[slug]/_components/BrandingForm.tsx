'use client';

import { Image as ImageIcon, Layers, Palette, Settings, Type } from 'lucide-react';
import { useState } from 'react';
import { HslColorPicker, type HslColor } from 'react-colorful';

import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';

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

const TABS: ReadonlyArray<{ key: TabKey; label: string; icon: typeof Settings }> = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'brand', label: 'Brand colors', icon: Palette },
  { key: 'logos', label: 'Logos', icon: Layers },
  { key: 'fonts', label: 'Fonts', icon: Type },
  { key: 'media', label: 'Media', icon: ImageIcon },
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

  function setField<K extends keyof UnifiedClientBranding>(
    key: K,
    next: UnifiedClientBranding[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      {/* Tab strip */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200 px-3 dark:border-zinc-800">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={active ? 'page' : undefined}
              className={`relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-[13px] font-medium transition ${
                active
                  ? 'text-zinc-900 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {label}
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-zinc-900 dark:bg-white" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div className="p-6">
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
              <Field label="Latitude">
                <TextInput
                  value={value.location?.lat?.toString() ?? ''}
                  onChange={(v) => {
                    const num = v === '' ? undefined : Number(v);
                    if (v !== '' && Number.isNaN(num)) return;
                    setField('location', { ...value.location, lat: num });
                  }}
                  placeholder="33.4484"
                />
              </Field>
              <Field label="Longitude">
                <TextInput
                  value={value.location?.lon?.toString() ?? ''}
                  onChange={(v) => {
                    const num = v === '' ? undefined : Number(v);
                    if (v !== '' && Number.isNaN(num)) return;
                    setField('location', { ...value.location, lon: num });
                  }}
                  placeholder="-112.0740"
                />
              </Field>
            </div>
          </Panel>
        ) : null}

        {tab === 'brand' ? (
          <Panel>
            <ColorRow label="Primary" value={value.brand.primary} onChange={(v) => setField('brand', { ...value.brand, primary: v })} />
            <ColorRow label="Secondary" value={value.brand.secondary} onChange={(v) => setField('brand', { ...value.brand, secondary: v })} />
            <ColorRow label="Accent" value={value.brand.accent} onChange={(v) => setField('brand', { ...value.brand, accent: v })} />
            <ColorRow label="Neutral" value={value.brand.neutral ?? '0 0% 7%'} onChange={(v) => setField('brand', { ...value.brand, neutral: v })} />
          </Panel>
        ) : null}

        {tab === 'logos' ? (
          <Panel>
            <Field label="Default" hint="Main logo — used by every product.">
              <TextInput value={value.logos.default ?? ''} onChange={(v) => setField('logos', { ...value.logos, default: v })} placeholder="assets/logo.svg or https://..." />
            </Field>
            <Field label="Dark" hint="Variant for light backgrounds (signage). Falls back to default if empty.">
              <TextInput value={value.logos.dark ?? ''} onChange={(v) => setField('logos', { ...value.logos, dark: v })} placeholder="assets/logo-dark.svg" />
            </Field>
            <Field label="Idle" hint="Large variant for the kiosk Billboard idle screen.">
              <TextInput value={value.logos.idle ?? ''} onChange={(v) => setField('logos', { ...value.logos, idle: v })} placeholder="assets/logo-idle.svg" />
            </Field>
            <Field label="Footer" hint="Compact variant for the kiosk footer band.">
              <TextInput value={value.logos.footer ?? ''} onChange={(v) => setField('logos', { ...value.logos, footer: v })} placeholder="assets/logo-footer.svg" />
            </Field>
          </Panel>
        ) : null}

        {tab === 'fonts' ? (
          <Panel>
            <Field label="Display font" hint="Used for headlines, CTAs and large numbers.">
              <FontSelect value={value.fonts.display} onChange={(v) => setField('fonts', { ...value.fonts, display: v })} />
            </Field>
            <Field label="Body font" hint="Used for body copy and supporting text.">
              <FontSelect value={value.fonts.body} onChange={(v) => setField('fonts', { ...value.fonts, body: v })} />
            </Field>
          </Panel>
        ) : null}

        {tab === 'media' ? (
          <Panel>
            <Field label="Kiosk hero kind">
              <select
                value={value.homeHero?.kind ?? 'image'}
                onChange={(e) => setField('homeHero', { kind: e.target.value as 'image' | 'video', src: value.homeHero?.src ?? '' })}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[12.5px] outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </Field>
            <Field label="Kiosk hero URL">
              <TextInput value={value.homeHero?.src ?? ''} onChange={(v) => setField('homeHero', { kind: value.homeHero?.kind ?? 'image', src: v })} placeholder="assets/home/hero.jpg or https://...mp4" />
            </Field>
            <Field label="Favicon">
              <TextInput value={value.favicon ?? ''} onChange={(v) => setField('favicon', v)} placeholder="assets/favicon.ico" />
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[12.5px]">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[12.5px] text-zinc-800 outline-none transition focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
    />
  );
}

function FontSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
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

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const hsl = parseHsl(value);
  return (
    <div className="relative flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
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
            onChange={(c: HslColor) => onChange(`${Math.round(c.h)} ${Math.round(c.s)}% ${Math.round(c.l)}%`)}
            style={{ width: 200, height: 150 }}
          />
          <button type="button" onClick={() => setOpen(false)} className="mt-2 w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
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
