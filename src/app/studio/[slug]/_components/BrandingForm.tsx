'use client';

import { useState } from 'react';
import { HslColorPicker, type HslColor } from 'react-colorful';

import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';

/**
 * `<BrandingForm>` — formulario unificado del branding del cliente.
 *
 * Cinco grupos: General · Brand · Logos · Fonts · Media. Cada cambio
 * dispara `onChange(next)` con el branding completo; el caller debounce-y-
 * persiste vía `PATCH /api/studio/clients/[slug]/branding` (ver ClientView).
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */
export interface BrandingFormProps {
  value: UnifiedClientBranding;
  onChange: (next: UnifiedClientBranding) => void;
}

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
  function setField<K extends keyof UnifiedClientBranding>(
    key: K,
    next: UnifiedClientBranding[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Group: General */}
      <Group title="General">
        <Field label="Nombre">
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
        <Field label="Ciudad">
          <TextInput
            value={value.location?.city ?? ''}
            onChange={(v) =>
              setField('location', { ...value.location, city: v })
            }
            placeholder="Phoenix, AZ"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitud">
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
          <Field label="Longitud">
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
      </Group>

      {/* Group: Brand colors */}
      <Group title="Brand colors">
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
      </Group>

      {/* Group: Logos */}
      <Group title="Logos">
        <Field label="Default" hint="Logo principal — usado por todos los productos.">
          <TextInput
            value={value.logos.default ?? ''}
            onChange={(v) => setField('logos', { ...value.logos, default: v })}
            placeholder="assets/logo.svg o https://..."
          />
        </Field>
        <Field label="Dark" hint="Variante para fondos claros (signage). Cae al default si vacío.">
          <TextInput
            value={value.logos.dark ?? ''}
            onChange={(v) => setField('logos', { ...value.logos, dark: v })}
            placeholder="assets/logo-dark.svg"
          />
        </Field>
        <Field label="Idle" hint="Variante grande para Billboard idle (kiosk).">
          <TextInput
            value={value.logos.idle ?? ''}
            onChange={(v) => setField('logos', { ...value.logos, idle: v })}
            placeholder="assets/logo-idle.svg"
          />
        </Field>
        <Field label="Footer" hint="Variante compacta para footer (kiosk).">
          <TextInput
            value={value.logos.footer ?? ''}
            onChange={(v) => setField('logos', { ...value.logos, footer: v })}
            placeholder="assets/logo-footer.svg"
          />
        </Field>
      </Group>

      {/* Group: Fonts */}
      <Group title="Fonts">
        <Field label="Display font">
          <FontSelect
            value={value.fonts.display}
            onChange={(v) => setField('fonts', { ...value.fonts, display: v })}
          />
        </Field>
        <Field label="Body font">
          <FontSelect
            value={value.fonts.body}
            onChange={(v) => setField('fonts', { ...value.fonts, body: v })}
          />
        </Field>
      </Group>

      {/* Group: Media */}
      <Group title="Media (kiosk hero)">
        <Field label="Tipo">
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
            <option value="image">Imagen</option>
            <option value="video">Video</option>
          </select>
        </Field>
        <Field label="URL">
          <TextInput
            value={value.homeHero?.src ?? ''}
            onChange={(v) =>
              setField('homeHero', {
                kind: value.homeHero?.kind ?? 'image',
                src: v,
              })
            }
            placeholder="assets/home/hero.jpg / https://...mp4"
          />
        </Field>
        <Field label="Favicon">
          <TextInput
            value={value.favicon ?? ''}
            onChange={(v) => setField('favicon', v)}
            placeholder="assets/favicon.ico"
          />
        </Field>
      </Group>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Primitives
// ---------------------------------------------------------------------------

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h3 className="mb-4 font-display text-[14px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
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
  return (
    <label className="flex flex-col gap-1.5 text-[12.5px]">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-zinc-500">{hint}</span> : null}
    </label>
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

function FontSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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

/**
 * Color row con swatch + popover de HSL picker. Acepta strings HSL
 * ("H S% L%") o hex; el wire format del unified branding es HSL.
 */
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
  return (
    <div className="relative flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
      <span className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? 'Cerrar' : 'Abrir'} selector de ${label}`}
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
  return {
    h: Math.round(Number(m[1])),
    s: Math.round(Number(m[2])),
    l: Math.round(Number(m[3])),
  };
}
