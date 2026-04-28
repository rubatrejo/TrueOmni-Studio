'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import type { Branding } from '@/lib/studio/schema';

import { STUDIO_SECTIONS, type StudioSectionKey } from '../_lib/sections';

import { FontSelector } from './FontSelector';
import { ImageField } from './ImageField';

export function EditorPanel({
  sectionKey,
  branding,
  onBrandingChange,
}: {
  sectionKey: StudioSectionKey;
  branding: Branding;
  onBrandingChange: (next: Branding) => void;
}) {
  const section = STUDIO_SECTIONS.find((s) => s.key === sectionKey)!;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-200 px-6 py-5 dark:border-zinc-900">
        <p className="mb-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
          {section.num} · Phase {section.phase}
        </p>
        <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
          {section.title}
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          {section.description}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {sectionKey === 'branding' && (
          <BrandingEditor branding={branding} onChange={onBrandingChange} />
        )}
        {sectionKey !== 'branding' && <ComingSoon section={section} />}
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
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12.5px] text-zinc-600 transition hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Suggest a palette from a logo
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
        <div className="grid grid-cols-2 gap-2">
          <ImageField
            label="Default logo"
            hint="SVG · PNG (transparent)"
            value={branding.logo}
            onChange={(v) => setField('logo', v)}
          />
          <ImageField
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
      <Group title="Typography" hint="Headings + body fonts (Google Fonts curated).">
        <FontSelector
          kind="Display"
          value={branding.fonts?.display ?? 'Montserrat'}
          onChange={(v) => setFont('display', v)}
        />
        <FontSelector
          kind="Body"
          value={branding.fonts?.body ?? 'Open Sans'}
          onChange={(v) => setFont('body', v)}
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
  { name: 'TrueOmni', tagline: 'Tech Blue', primary: '#004F8B', secondary: '#0088CE', tertiary: '#B9BD39' },
  { name: 'Arizona', tagline: 'Desert', primary: '#5C2317', secondary: '#D2691E', tertiary: '#F4A460' },
  { name: 'Hotel Beach', tagline: 'Calm', primary: '#1E5F74', secondary: '#42B5D9', tertiary: '#FCD581' },
  { name: 'Forest', tagline: 'Nature', primary: '#173B30', secondary: '#3E885B', tertiary: '#E0C879' },
  { name: 'Mono', tagline: 'Editorial', primary: '#0A0A0A', secondary: '#404040', tertiary: '#FACC15' },
  { name: 'Sunset', tagline: 'Warm', primary: '#7C2D12', secondary: '#EA580C', tertiary: '#FCD34D' },
];

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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
