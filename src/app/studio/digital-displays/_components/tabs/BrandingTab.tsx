'use client';

import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HslColorPicker, type HslColor } from 'react-colorful';

import type { SignageClientResolved } from '@/lib/signage/schema';

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
      <header>
        <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
          Branding
        </h2>
        <p className="mt-1 text-[13px] text-zinc-500">
          Cambios se reflejan live en el preview a la derecha y se guardan al KV
          un segundo después.
        </p>
      </header>

      {/* 4 brand tokens con color picker */}
      <section className="flex flex-col gap-5">
        <header>
          <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            Brand colors
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Cambia estos 4 tokens y todo el runtime signage del cliente se
            recolorea.
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

      <Section title="Fonts" subtitle="Editor de fonts y custom upload — DSS-fix6.">
        <DataRow
          label="Default"
          value={
            <code className="font-mono text-[12px]">
              {draft?.branding.fonts.default ?? client.branding.fonts.default}
            </code>
          }
        />
        <DataRow
          label="Display"
          value={
            draft?.branding.fonts.display ?? client.branding.fonts.display ? (
              <code className="font-mono text-[12px]">
                {draft?.branding.fonts.display ?? client.branding.fonts.display}
              </code>
            ) : (
              <EmptyHint>not configured</EmptyHint>
            )
          }
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
            <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-white">
              {label}
            </h4>
            {isOverride ? (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                override
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-zinc-500">
            {description}
          </p>
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
          <span className="block text-[11px] text-zinc-500">
            --signage-{tokenKey}
          </span>
        </span>
      </button>

      {open ? (
        <div className="flex flex-col items-center gap-2 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/50">
          <HslColorPicker
            color={hslObj}
            onChange={(c: HslColor) => onChange(formatHsl(c))}
            style={{ width: '100%', height: 160 }}
          />
          <div className="flex w-full items-center gap-2">
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
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-2 text-[13px] last:border-0 last:pb-0 dark:border-zinc-900">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] italic text-zinc-400">{children}</span>;
}
