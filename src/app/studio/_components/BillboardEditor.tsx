'use client';

import { Check, ChevronDown, GripVertical } from 'lucide-react';
import { useMemo } from 'react';

import {
  BILLBOARD_LOGO_SIZES,
  BILLBOARD_VARIANTS,
  DEFAULT_BILLBOARD_B0,
  type BillboardB0Config,
  type BillboardConfig,
  type BillboardLogoSize,
  type BillboardVariant,
  type ModuleEntry,
} from '@/lib/studio/schema';

import {
  ColorRow,
  FooterLogoPositionSection,
  LogoPositionSection,
  SliderRow,
  trailingEmpty,
} from './billboard/controls';
import { BILLBOARD_WIREFRAMES } from './billboard-wireframes';
import { MediaField } from './MediaField';

const VARIANT_INFO: Record<BillboardVariant, { name: string; tagline: string }> = {
  0: { name: 'Variant 1', tagline: 'Hero photo + center logo' },
  1: { name: 'Variant 2', tagline: 'Grid + clock & weather' },
  2: { name: 'Variant 3', tagline: 'Hero + 3-up carousel' },
  3: { name: 'Variant 4', tagline: '2 cards + center banner + 2 cards' },
};

const LOGO_SIZE_INFO: Record<BillboardLogoSize, { label: string; px: string }> = {
  S: { label: 'Small', px: '80px' },
  M: { label: 'Medium', px: '128px' },
  L: { label: 'Large', px: '180px' },
  XL: { label: 'Extra Large', px: '360px' },
};

/** Mapping de tamaño del logo del footer (más pequeño que el hero). */
const FOOTER_LOGO_SIZE_INFO: Record<BillboardLogoSize, { label: string; px: string }> = {
  S: { label: 'Small', px: '48px' },
  M: { label: 'Medium', px: '65px' },
  L: { label: 'Large', px: '96px' },
  XL: { label: 'Extra Large', px: '192px' },
};

/** Cuántos slots de módulos pinta cada variant (B0 = 0, no tiene grid). */
const VARIANT_SLOTS: Record<BillboardVariant, number> = {
  0: 0,
  1: 4,
  2: 4,
  3: 4,
};

/** Variants que muestran logo idle grande editable. B1 no aplica. */
const VARIANT_HAS_LOGO: Record<BillboardVariant, boolean> = {
  0: true,
  1: false,
  2: true,
  3: true,
};

export function BillboardEditor({
  billboard,
  onChange,
  modulesAvailable,
  onBillboardPreview,
  brandVideo,
}: {
  billboard: BillboardConfig;
  onChange: (next: BillboardConfig) => void;
  /**
   * Lista de módulos activos en el Modules tab (filtrados por `enabled` y
   * excluyendo `wayfinding`). El Billboard solo puede usar módulos que ya
   * existen en el kiosk.
   */
  modulesAvailable: readonly ModuleEntry[];
  /** Audit F-23: al elegir un variant nuevo, también disparamos el preview
   *  del idle en el iframe para que el operador vea el cambio sin clic extra. */
  onBillboardPreview?: () => void;
  /** Brand video del cliente — si está poblado, muestra el botón
   *  "Use brand video" en la sección Background para un picker rápido. */
  brandVideo?: { kind: 'upload' | 'youtube'; src: string };
}) {
  const slots = VARIANT_SLOTS[billboard.variant];
  const hasLogo = VARIANT_HAS_LOGO[billboard.variant];
  const notEnoughModules = slots > 0 && modulesAvailable.length < slots;
  // Settings idle per variant — todos los variants comparten el mismo shape
  // BillboardB0Config (background + touchHere + overlay). Cada variant
  // runtime aplica los campos relevantes a su layout y silenciosamente
  // ignora los demás.
  const variantKey = `b${billboard.variant}` as 'b0' | 'b1' | 'b2' | 'b3';
  // Mantener sincronizado con `VARIANT_DEFAULT_BACKGROUND` en
  // `use-billboard-override.ts`. B2 usa `hero.png`; B3 reutiliza el de B0
  // porque no se exporta hero dedicado.
  const variantDefaultSrc =
    billboard.variant === 0
      ? '/assets/billboard-0/hero.jpg'
      : billboard.variant === 1
        ? '/assets/billboard-1/hero.jpg'
        : billboard.variant === 2
          ? '/assets/billboard-2/hero.png'
          : '/assets/billboard-0/hero.jpg';
  const b0: BillboardB0Config = {
    ...DEFAULT_BILLBOARD_B0,
    ...(billboard[variantKey] ?? {}),
    background: {
      ...DEFAULT_BILLBOARD_B0.background,
      src: variantDefaultSrc,
      ...((billboard[variantKey] as BillboardB0Config | undefined)?.background ?? {}),
    },
  } as BillboardB0Config;
  const setB0 = (patch: Partial<BillboardB0Config>) =>
    onChange({ ...billboard, [variantKey]: { ...b0, ...patch } });

  // Slots actuales: paddear a `slots` con strings vacíos para que el render
  // siempre pinte exactamente N slots, aunque billboard.modules tenga menos.
  const slotValues = useMemo(() => {
    const arr = [...billboard.modules.slice(0, slots)];
    while (arr.length < slots) arr.push('');
    return arr;
  }, [billboard.modules, slots]);

  const setSlot = (index: number, key: string) => {
    const next = [...slotValues];
    next[index] = key;
    // Limpiar trailing empty al guardar para no contaminar el config publicado.
    const cleaned = next.filter((v, i) => v !== '' || i < next.length - trailingEmpty(next));
    onChange({ ...billboard, modules: cleaned });
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slots) return;
    const next = [...slotValues];
    const tmp = next[index]!;
    next[index] = next[target]!;
    next[target] = tmp;
    onChange({ ...billboard, modules: next });
  };

  return (
    <div className="space-y-7">
      {/* ───────────── Idle layout (wireframes) ───────────── */}
      <section>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Idle layout
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Pick which Billboard the kiosk shows when idle. Live preview updates instantly.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2.5">
          {BILLBOARD_VARIANTS.map((v) => {
            const info = VARIANT_INFO[v];
            const Wireframe = BILLBOARD_WIREFRAMES[v];
            const active = billboard.variant === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  onChange({ ...billboard, variant: v });
                  onBillboardPreview?.();
                }}
                className={
                  'group relative overflow-hidden rounded-lg border p-2.5 text-left transition ' +
                  (active
                    ? 'border-sky-500/60 bg-sky-500/5 ring-2 ring-sky-500/30 dark:border-sky-400/60 dark:bg-sky-500/10'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700')
                }
              >
                <div className="mb-2 flex aspect-[9/16] w-full items-center justify-center overflow-hidden rounded-md bg-zinc-50 p-2 dark:bg-zinc-950/40">
                  <Wireframe />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-200">
                      {info.name}
                    </div>
                    <div className="mt-0.5 truncate text-[10.5px] text-zinc-500">
                      {info.tagline}
                    </div>
                  </div>
                  {active && (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500 text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ───────────── Background (shared across all 4 variants) ───────────── */}
      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Background (shared across all variants)
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              One image/video applies to the hero of all 4 idle layouts so the kiosk identity stays
              consistent when switching variants.
            </p>
          </div>
          {brandVideo?.src ? (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...billboard,
                  background: { type: 'video', src: brandVideo.src },
                })
              }
              className="shrink-0 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:border-sky-800 dark:hover:bg-sky-950/60"
              title="Use the client's brand video from Branding → Media"
            >
              ▶ Use brand video
            </button>
          ) : null}
        </header>
        <MediaField
          label="Drop image or video"
          hint="1080×1920 portrait · JPG/PNG/WebP up to 5MB (compressed for upload) · MP4/WebM up to 2MB inline (paste a CDN URL below for larger videos)"
          aspect="9/16"
          maxImageBytes={5 * 1024 * 1024}
          maxVideoBytes={2 * 1024 * 1024}
          value={billboard.background?.src ?? '/assets/billboard-0/hero.jpg'}
          kind={billboard.background?.type ?? 'image'}
          onChange={(next) => {
            if (!next) {
              onChange({
                ...billboard,
                background: { type: 'image', src: '/assets/billboard-0/hero.jpg' },
              });
              return;
            }
            onChange({
              ...billboard,
              background: { type: next.kind, src: next.src },
            });
          }}
        />
      </section>

      {/* ───────────── Idle settings (per-variant: touchHere + overlay) ───────────── */}
      {true && (
        <section className="space-y-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <header>
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Idle settings (Variant {billboard.variant + 1})
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              {billboard.variant === 0
                ? 'Touch Here button and overlay (per-variant). The background is shared above.'
                : 'Touch Here label and overlay (per-variant). The background is shared above. Button width/height sliders only apply to Variant 1.'}
            </p>
          </header>

          {/* Touch Here button — texto */}
          <div className="space-y-1.5">
            <label
              htmlFor="billboard-touchhere-label"
              className="block text-[12px] font-medium text-zinc-800 dark:text-zinc-200"
            >
              Touch Here label
            </label>
            <input
              id="billboard-touchhere-label"
              type="text"
              value={b0.touchHere.label}
              onChange={(e) => setB0({ touchHere: { ...b0.touchHere, label: e.target.value } })}
              placeholder="Touch Here   (leave empty to use the locale string)"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
            />
          </div>

          {/* Touch Here — 1 line / 2 lines */}
          <div className="space-y-1.5">
            <span className="block text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
              Layout
            </span>
            <div
              role="radiogroup"
              aria-label="Touch Here layout"
              className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <button
                role="radio"
                aria-checked={!b0.touchHere.twoLines}
                type="button"
                onClick={() => setB0({ touchHere: { ...b0.touchHere, twoLines: false } })}
                className={
                  'rounded-md px-3 py-1 text-[11.5px] transition ' +
                  (!b0.touchHere.twoLines
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                }
              >
                One line
              </button>
              <button
                role="radio"
                aria-checked={b0.touchHere.twoLines}
                type="button"
                onClick={() => setB0({ touchHere: { ...b0.touchHere, twoLines: true } })}
                className={
                  'rounded-md px-3 py-1 text-[11.5px] transition ' +
                  (b0.touchHere.twoLines
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                }
              >
                Two lines
              </button>
            </div>
          </div>

          {/* Touch Here — text case (Title Case por default / UPPERCASE) */}
          <div className="space-y-1.5">
            <span className="block text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
              Text case
            </span>
            <div
              role="radiogroup"
              aria-label="Touch Here text case"
              className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <button
                role="radio"
                aria-checked={!b0.touchHere.uppercase}
                type="button"
                onClick={() => setB0({ touchHere: { ...b0.touchHere, uppercase: false } })}
                className={
                  'rounded-md px-3 py-1 text-[11.5px] transition ' +
                  (!b0.touchHere.uppercase
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                }
              >
                Title Case
              </button>
              <button
                role="radio"
                aria-checked={b0.touchHere.uppercase}
                type="button"
                onClick={() => setB0({ touchHere: { ...b0.touchHere, uppercase: true } })}
                className={
                  'rounded-md px-3 py-1 text-[11.5px] transition ' +
                  (b0.touchHere.uppercase
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                }
              >
                UPPERCASE
              </button>
            </div>
          </div>

          {/* Touch Here — width / height / fontSize sliders. Width/height
              solo aplican al botón visible de Variant 1 (B0). En B1/B2/B3 el
              touchHere se renderiza como texto inline sobre el hero, así que
              ocultamos los sliders para no engañar al operador. */}
          {billboard.variant === 0 && (
            <>
              <SliderRow
                label="Button width"
                min={280}
                max={900}
                step={10}
                unit="px"
                value={b0.touchHere.width}
                onChange={(width) => setB0({ touchHere: { ...b0.touchHere, width } })}
              />
              <SliderRow
                label="Button height"
                min={120}
                max={500}
                step={10}
                unit="px"
                value={b0.touchHere.height}
                onChange={(height) => setB0({ touchHere: { ...b0.touchHere, height } })}
              />
            </>
          )}
          <SliderRow
            label="Font size"
            min={24}
            max={220}
            step={2}
            unit="px"
            value={b0.touchHere.fontSize}
            onChange={(fontSize) => setB0({ touchHere: { ...b0.touchHere, fontSize } })}
          />

          {/* Overlay — solid color o gradient */}
          <div className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
              Overlay
            </span>
            <div
              role="radiogroup"
              aria-label="Overlay mode"
              className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <button
                role="radio"
                aria-checked={b0.overlay.mode === 'solid'}
                type="button"
                onClick={() => setB0({ overlay: { ...b0.overlay, mode: 'solid' } })}
                className={
                  'rounded-md px-3 py-1 text-[11.5px] transition ' +
                  (b0.overlay.mode === 'solid'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                }
              >
                Solid color
              </button>
              <button
                role="radio"
                aria-checked={b0.overlay.mode === 'gradient'}
                type="button"
                onClick={() => setB0({ overlay: { ...b0.overlay, mode: 'gradient' } })}
                className={
                  'rounded-md px-3 py-1 text-[11.5px] transition ' +
                  (b0.overlay.mode === 'gradient'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                }
              >
                Gradient
              </button>
            </div>

            {b0.overlay.mode === 'solid' ? (
              <>
                <ColorRow
                  label="Color"
                  value={b0.overlay.color}
                  onChange={(color) => setB0({ overlay: { ...b0.overlay, color } })}
                />
                <SliderRow
                  label="Opacity"
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  value={Math.round(b0.overlay.opacity * 100)}
                  onChange={(pct) =>
                    setB0({
                      overlay: {
                        ...b0.overlay,
                        opacity: Math.max(0, Math.min(1, pct / 100)),
                      },
                    })
                  }
                  hint="0% = no overlay. Useful to darken bright backgrounds so the logo and button stay readable."
                />
              </>
            ) : (
              <>
                <ColorRow
                  label="From color"
                  value={b0.overlay.gradient.from}
                  onChange={(from) =>
                    setB0({
                      overlay: {
                        ...b0.overlay,
                        gradient: { ...b0.overlay.gradient, from },
                      },
                    })
                  }
                />
                <ColorRow
                  label="To color"
                  value={b0.overlay.gradient.to}
                  onChange={(to) =>
                    setB0({
                      overlay: {
                        ...b0.overlay,
                        gradient: { ...b0.overlay.gradient, to },
                      },
                    })
                  }
                />
                <SliderRow
                  label="Angle"
                  min={0}
                  max={360}
                  step={15}
                  unit="°"
                  value={b0.overlay.gradient.angle}
                  onChange={(angle) =>
                    setB0({
                      overlay: {
                        ...b0.overlay,
                        gradient: { ...b0.overlay.gradient, angle },
                      },
                    })
                  }
                  hint="180° = top → bottom. Use 8-digit hex (#rrggbbAA) on To color for transparent fade."
                />
              </>
            )}
          </div>
        </section>
      )}

      {/* ───────────── Logo size (B0/B2/B3) ───────────── */}
      {hasLogo && (
        <section>
          <header className="mb-3">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Logo size
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              Height of the idle logo on the Billboard.
            </p>
          </header>

          <div
            role="radiogroup"
            aria-label="Logo size"
            className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            {BILLBOARD_LOGO_SIZES.map((size) => {
              const info = LOGO_SIZE_INFO[size];
              const active = billboard.logoSize === size;
              return (
                <button
                  key={size}
                  role="radio"
                  aria-checked={active}
                  type="button"
                  onClick={() => onChange({ ...billboard, logoSize: size })}
                  className={
                    'flex flex-col items-center rounded-md px-3.5 py-1.5 text-[11.5px] transition ' +
                    (active
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                  }
                >
                  <span className="font-semibold">{info.label}</span>
                  <span
                    className={
                      'mt-0.5 font-mono text-[9.5px] ' +
                      (active ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500')
                    }
                  >
                    {info.px}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ───────────── Logo position (B0/B2/B3) ───────────── */}
      {hasLogo && <LogoPositionSection billboard={billboard} onChange={onChange} />}

      {/* ───────────── Footer logo position (solo B0 lo aplica) ───────────── */}
      {billboard.variant === 0 && (
        <FooterLogoPositionSection billboard={billboard} onChange={onChange} />
      )}

      {/* ───────────── Footer logo size (todos los variants) ───────────── */}
      <section>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Footer logo size
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Height of the “Powered by” logo at the bottom of every idle variant.
          </p>
        </header>
        <div
          role="radiogroup"
          aria-label="Footer logo size"
          className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          {BILLBOARD_LOGO_SIZES.map((size) => {
            const info = FOOTER_LOGO_SIZE_INFO[size];
            const active = (billboard.footerLogoSize ?? 'M') === size;
            return (
              <button
                key={size}
                role="radio"
                aria-checked={active}
                type="button"
                onClick={() => onChange({ ...billboard, footerLogoSize: size })}
                className={
                  'flex flex-col items-center rounded-md px-3.5 py-1.5 text-[11.5px] transition ' +
                  (active
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                }
              >
                <span className="font-semibold">{info.label}</span>
                <span
                  className={
                    'mt-0.5 font-mono text-[9.5px] ' +
                    (active ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500')
                  }
                >
                  {info.px}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ───────────── Modules in this layout (B1/B2/B3) ───────────── */}
      {slots > 0 && (
        <section>
          <header className="mb-3">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Modules in this layout
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              {slots} slots — pick which active modules show on the Billboard, in order.
            </p>
          </header>

          {notEnoughModules && (
            <p className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11.5px] text-amber-600 dark:text-amber-400">
              Activate at least {slots} modules in the Modules tab to fill all slots of this
              billboard.
            </p>
          )}

          <ol className="space-y-1.5">
            {slotValues.map((value, index) => (
              <li
                key={index}
                className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white py-1 pl-1 pr-2 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveSlot(index, -1)}
                    disabled={index === 0}
                    aria-label="Move slot up"
                    className="grid h-3 w-5 place-items-center rounded text-zinc-400 transition hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
                  >
                    <GripVertical className="h-2.5 w-2.5 rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlot(index, 1)}
                    disabled={index === slots - 1}
                    aria-label="Move slot down"
                    className="grid h-3 w-5 place-items-center rounded text-zinc-400 transition hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
                  >
                    <GripVertical className="h-2.5 w-2.5 -rotate-90" />
                  </button>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="relative flex-1">
                  <select
                    value={value}
                    onChange={(e) => setSlot(index, e.target.value)}
                    className="w-full appearance-none rounded-md bg-transparent py-1 pl-1.5 pr-6 text-[12px] text-zinc-800 outline-none focus:ring-2 focus:ring-sky-500/40 dark:text-zinc-200"
                    aria-label={`Slot ${index + 1} module`}
                  >
                    <option value="">— Empty —</option>
                    {modulesAvailable.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label.replace(/\n/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400"
                    aria-hidden
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ───────────── Inactivity timeout (sin cambios) ───────────── */}
      <section>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Inactivity timeout
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Seconds without interaction before the kiosk shows the &ldquo;Are you still
            there?&rdquo; warning and returns to idle.
          </p>
        </header>

        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-900 dark:bg-zinc-900/40">
          <input
            type="range"
            min={15}
            max={300}
            step={5}
            value={billboard.idleTimeoutSec}
            onChange={(e) => onChange({ ...billboard, idleTimeoutSec: Number(e.target.value) })}
            className="flex-1 accent-sky-500"
            aria-label="Idle timeout seconds"
          />
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11.5px] dark:border-zinc-800 dark:bg-zinc-950">
            <input
              type="number"
              min={15}
              max={600}
              value={billboard.idleTimeoutSec}
              onChange={(e) =>
                onChange({
                  ...billboard,
                  idleTimeoutSec: Math.max(15, Math.min(600, Number(e.target.value) || 15)),
                })
              }
              className="w-12 bg-transparent text-right outline-none"
            />
            <span className="text-zinc-500">s</span>
          </div>
        </div>
      </section>
    </div>
  );
}
