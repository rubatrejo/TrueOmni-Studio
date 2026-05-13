'use client';

import { RotateCcw, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { HslColorPicker, type HslColor } from 'react-colorful';

import type { SignageClientResolved } from '@/lib/signage/schema';

import { BrandingSyncBanner } from '../../../_components/BrandingSyncBanner';
import { CustomFontField } from '../../../_components/CustomFontField';
import { FontSelector } from '../../../_components/FontSelector';
import { useThemeEditStore } from '../../_lib/theme-edit-store';
import { SignageMediaField } from '../display/modules/SignageMediaField';

/**
 * Tab `Branding` editable.
 *
 * Editor visual de los 4 brand tokens (`brand-primary`, `brand-secondary`,
 * `brand-accent`, `brand-neutral`) con `<HslColorPicker>` de react-colorful.
 * Cada cambio actualiza `useThemeEditStore` → autosave KV + bridge.pushClient
 * (live preview <120ms).
 *
 * Logos y fonts siguen read-only (upload aterriza con asset endpoint
 * Vercel Blob). El listado completo de tokens overrides se ve abajo,
 * editable por cualquier key arbitraria + remove.
 */
export interface BrandingTabProps {
  client: SignageClientResolved;
  tokensCss: string;
}

const BRAND_TOKEN_KEYS: Array<{ key: string; label: string; description: string }> = [
  {
    key: 'brand-primary',
    label: 'Primary',
    description: 'Color principal del header band y elementos clave del runtime.',
  },
  {
    key: 'brand-secondary',
    label: 'Secondary',
    description: 'Acentos secundarios (badges, links, ring de focus).',
  },
  {
    key: 'brand-accent',
    label: 'Accent',
    description: 'Acentos cálidos (highlights, CTAs ocasionales).',
  },
  {
    key: 'brand-neutral',
    label: 'Neutral',
    description: 'Texto sobre fondos claros y elementos neutros.',
  },
];

export function BrandingTab({ client, tokensCss }: BrandingTabProps) {
  const draft = useThemeEditStore((s) => s.draft);
  const setBrandingToken = useThemeEditStore((s) => s.setBrandingToken);
  const removeBrandingToken = useThemeEditStore((s) => s.removeBrandingToken);
  const updateBranding = useThemeEditStore((s) => s.updateBranding);

  const baseTokensFromCss = useMemo(() => parseTokensCss(tokensCss), [tokensCss]);
  const draftTokens = draft?.branding.tokens ?? client.branding.tokens ?? {};

  function resolveToken(key: string): string {
    return draftTokens[key] ?? baseTokensFromCss[key] ?? '0 0% 50%';
  }

  return (
    <div className="flex flex-col gap-8">
      <BrandingSyncBanner slug={client.slug} product="signage" />
      <header>
        <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
          Branding
        </h2>
        <p className="mt-1 text-[13px] text-zinc-500">
          Cambios se reflejan live en el preview a la derecha y se guardan al KV un segundo después.
        </p>
      </header>

      {/* 4 brand tokens con color picker */}
      <section className="flex flex-col gap-5">
        <header>
          <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            Brand colors
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Cambia estos 4 tokens y todo el runtime signage del cliente se recolorea.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3">
          {BRAND_TOKEN_KEYS.map(({ key, label, description }) => {
            const currentHsl = resolveToken(key);
            const baseHsl = baseTokensFromCss[key];
            const isOverride = draftTokens[key] != null;
            return (
              <BrandTokenCard
                key={key}
                label={label}
                description={description}
                tokenKey={key}
                currentHsl={currentHsl}
                baseHsl={baseHsl}
                isOverride={isOverride}
                onChange={(hsl) => setBrandingToken(key, hsl)}
                onReset={baseHsl ? () => removeBrandingToken(key) : undefined}
              />
            );
          })}
        </div>
      </section>

      {/* Logos editables + fonts (read-only por ahora) */}
      <Section
        title="Logos"
        subtitle="Sube SVG o PNG (≤ 5 MB). Versión dark se muestra cuando el header tiene fondo claro."
      >
        <SignageMediaField
          label="Default logo"
          hint="Logo principal del header (SVG/PNG). Path o Blob URL."
          aspect="3/1"
          kind="image"
          value={draft?.branding.logos.default ?? client.branding.logos.default}
          onChange={(next) => {
            const current = draft?.branding.logos ?? client.branding.logos;
            updateBranding({
              logos: { ...current, default: next?.src ?? '' },
            });
          }}
        />
        <SignageMediaField
          label="Dark logo (optional)"
          hint="Variante para fondos claros. Cae al default si está vacío."
          aspect="3/1"
          kind="image"
          value={draft?.branding.logos.dark ?? client.branding.logos.dark}
          onChange={(next) => {
            const current = draft?.branding.logos ?? client.branding.logos;
            const nextLogos: { default: string; dark?: string } = {
              ...current,
              default: current.default,
            };
            if (next?.src) {
              nextLogos.dark = next.src;
            } else {
              delete nextLogos.dark;
            }
            updateBranding({ logos: nextLogos });
          }}
        />
      </Section>

      <Section
        title="Fonts"
        subtitle="Google Fonts curados o tu propia tipografía custom (.woff2/.woff/.ttf/.otf, ≤600KB)."
      >
        {/* Display font — Montserrat default. */}
        <FontSelector
          kind="Display font"
          value={draft?.branding.fonts?.display ?? client.branding.fonts.display ?? 'Montserrat'}
          onChange={(next) => {
            const fonts = draft?.branding.fonts ?? client.branding.fonts;
            updateBranding({ fonts: { ...fonts, display: next } });
          }}
        />
        <CustomFontField
          slot="display"
          value={draft?.branding.fonts?.displayCustom ?? client.branding.fonts.displayCustom}
          onChange={(next) => {
            const fonts = draft?.branding.fonts ?? client.branding.fonts;
            const nextFonts = { ...fonts };
            if (next) nextFonts.displayCustom = next;
            else delete nextFonts.displayCustom;
            updateBranding({ fonts: nextFonts });
          }}
        />

        {/* Body font — Open Sans default. */}
        <FontSelector
          kind="Body font"
          value={draft?.branding.fonts?.body ?? client.branding.fonts.body ?? 'Open Sans'}
          onChange={(next) => {
            const fonts = draft?.branding.fonts ?? client.branding.fonts;
            updateBranding({ fonts: { ...fonts, body: next } });
          }}
        />
        <CustomFontField
          slot="body"
          value={draft?.branding.fonts?.bodyCustom ?? client.branding.fonts.bodyCustom}
          onChange={(next) => {
            const fonts = draft?.branding.fonts ?? client.branding.fonts;
            const nextFonts = { ...fonts };
            if (next) nextFonts.bodyCustom = next;
            else delete nextFonts.bodyCustom;
            updateBranding({ fonts: nextFonts });
          }}
        />
      </Section>

      {/* Otros tokens overrides */}
      <Section
        title="Other token overrides"
        subtitle={`${countNonBrand(draftTokens)} non-brand override${
          countNonBrand(draftTokens) === 1 ? '' : 's'
        } on top of base tokens`}
      >
        {countNonBrand(draftTokens) === 0 ? (
          <EmptyHint>No overrides — using base tokens.css</EmptyHint>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="pb-2 pr-4">Token</th>
                <th className="pb-2">Value (HSL)</th>
                <th className="w-12 pb-2" aria-label="actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {Object.entries(draftTokens)
                .filter(([k]) => !isBrandToken(k))
                .map(([key, value]) => (
                  <tr key={key}>
                    <td className="py-2 pr-4 font-mono text-[12px] text-zinc-700 dark:text-zinc-300">
                      --signage-{key}
                    </td>
                    <td className="py-2 font-mono text-[12px] text-zinc-700 dark:text-zinc-300">
                      {value}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeBrandingToken(key)}
                        className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        title="Remove override"
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section
        title="Base tokens.css"
        subtitle={`Resolved from clients-signage/${client.slug}/tokens.css`}
      >
        {tokensCss ? (
          <pre className="max-h-64 overflow-auto rounded-md bg-zinc-50 p-3 font-mono text-[11.5px] leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {tokensCss}
          </pre>
        ) : (
          <EmptyHint>tokens.css not found for this theme</EmptyHint>
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  BrandTokenCard
// ---------------------------------------------------------------------------

interface BrandTokenCardProps {
  label: string;
  description: string;
  tokenKey: string;
  currentHsl: string;
  baseHsl: string | undefined;
  isOverride: boolean;
  onChange: (hsl: string) => void;
  onReset?: () => void;
}

function BrandTokenCard({
  label,
  description,
  tokenKey,
  currentHsl,
  baseHsl,
  isOverride,
  onChange,
  onReset,
}: BrandTokenCardProps) {
  const [open, setOpen] = useState(false);
  const hslObj = parseHslString(currentHsl) ?? { h: 0, s: 0, l: 50 };
  const cssColor = `hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)`;

  return (
    <article className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-white">{label}</h4>
            {isOverride ? (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                override
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-zinc-500">{description}</p>
        </div>
        {isOverride && onReset ? (
          <button
            type="button"
            onClick={onReset}
            title={`Reset to base value: ${baseHsl}`}
            className="shrink-0 rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        ) : null}
      </header>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-2 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
      >
        <span
          className="h-9 w-9 shrink-0 rounded-md border border-zinc-200 dark:border-zinc-800"
          style={{ backgroundColor: cssColor }}
          aria-label={`Current color for ${label}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[11.5px] text-zinc-700 dark:text-zinc-300">
            {currentHsl}
          </span>
          <span className="block text-[11px] text-zinc-500">--signage-{tokenKey}</span>
        </span>
      </button>

      {open ? (
        <div className="relative flex flex-col items-center gap-2 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close color picker"
            title="Close color picker"
            className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <HslColorPicker
            color={hslObj}
            onChange={(c: HslColor) => onChange(formatHsl(c))}
            style={{ width: '100%', height: 160 }}
          />
          <div className="flex w-full flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Hex
              </span>
              <HexInput
                hsl={hslObj}
                onChange={(c) => onChange(formatHsl(c))}
                ariaLabel={`Hex value for ${label}`}
              />
            </div>
            <label className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                HSL
              </span>
              <input
                type="text"
                value={currentHsl}
                onChange={(e) => {
                  const trimmed = e.target.value.trim();
                  if (parseHslString(trimmed)) onChange(trimmed);
                }}
                className="flex-1 rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11.5px] text-zinc-700 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                placeholder="H S% L%"
                aria-label={`HSL value for ${label}`}
              />
            </label>
          </div>
        </div>
      ) : null}
    </article>
  );
}

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function isBrandToken(key: string): boolean {
  return BRAND_TOKEN_KEYS.some((b) => b.key === key);
}

function countNonBrand(tokens: Record<string, string>): number {
  return Object.keys(tokens).filter((k) => !isBrandToken(k)).length;
}

/**
 * Parsea tokens.css extrayendo todas las declaraciones `--signage-<key>: <value>;`
 * dentro de `:root` y devuelve `{ <key>: <value> }`. value puede ser `H S% L%`,
 * `var(--xxx)` u otros formatos — los almacena verbatim para fallback display.
 */
function parseTokensCss(css: string): Record<string, string> {
  const result: Record<string, string> = {};
  const declRegex = /--signage-([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = declRegex.exec(css)) !== null) {
    const key = m[1];
    const value = m[2].trim();
    result[key] = value;
  }
  return result;
}

/** Parsea "H S% L%" → {h, s, l}. Devuelve null si no matchea. */
function parseHslString(value: string): HslColor | null {
  const m = value.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  return {
    h: Math.round(Number(m[1])),
    s: Math.round(Number(m[2])),
    l: Math.round(Number(m[3])),
  };
}

function formatHsl(c: HslColor): string {
  return `${Math.round(c.h)} ${Math.round(c.s)}% ${Math.round(c.l)}%`;
}

/**
 * `<HexInput>` — input controlado que muestra el HSL como #RRGGBB y actualiza
 * el HSL parent cuando el operator pega un hex válido. Mantiene un draft local
 * para que el operator pueda tipear sin que cada keypress reformatee.
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
  // Sync draft cuando el HSL externo cambia (picker, reset, hsl input).
  // Compara contra last-synced — no re-sincronizar si el draft sigue válido y
  // genera el mismo HSL, así el operator puede tipear sin interrupciones.
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
        // Si el blur deja un draft inválido, restauramos al actual.
        if (!hexToHsl(draft)) setDraft(computed);
      }}
      placeholder="#RRGGBB"
      aria-label={ariaLabel}
      className="flex-1 rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11.5px] uppercase text-zinc-700 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
    />
  );
}

/** Convierte HSL (0-360, 0-100, 0-100) a HEX uppercase #RRGGBB. */
export function hslToHex({ h, s, l }: HslColor): string {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to255 = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to255(r)}${to255(g)}${to255(b)}`.toUpperCase();
}

/** Parsea hex (#RGB | #RRGGBB) a HSL (0-360, 0-100, 0-100). null si inválido. */
export function hexToHsl(hex: string): HslColor | null {
  let v = hex.trim().replace(/^#/, '');
  if (v.length === 3)
    v = v
      .split('')
      .map((c) => c + c)
      .join('');
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// ---------------------------------------------------------------------------
//  Layout primitives
// ---------------------------------------------------------------------------

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header>
        <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
          {title}
        </h3>
        {subtitle ? <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p> : null}
      </header>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] italic text-zinc-400">{children}</span>;
}
