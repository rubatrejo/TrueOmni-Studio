'use client';

import { useEffect, useRef, useState } from 'react';
import { HslColorPicker, type HslColor } from 'react-colorful';

import type {
  SignageClientResolved,
  SignageHeader,
  SignageHeaderBackground,
  SignageOrientation,
} from '@/lib/signage/schema';

import { useThemeEditStore } from '../../_lib/theme-edit-store';
import { SignageMediaField } from '../display/modules/SignageMediaField';

/**
 * Tab `Header` editable.
 *
 * Form completo del `client.header`: position, height, layout, visibility
 * toggles, clock/weather settings. Background queda read-only por ahora —
 * el editor de gradients/images requiere upload (Vercel Blob) que aterriza
 * en el sub-fase de assets.
 *
 * Cada cambio actualiza `useThemeEditStore.updateHeader` → autosave KV +
 * bridge.pushClient. Los cambios estructurales (position, height) se
 * reflejan tras un reload del iframe (que el editor dispara automáticamente
 * después del save). Los cambios visuales que se mapean a CSS variables o
 * tokens (background color, brand-primary) se ven live.
 */
export interface HeaderTabProps {
  client: SignageClientResolved;
  /** Orientation del display que se está editando. Cuando es `portrait` el
   *  selector de forecastDays solo ofrece 1/2 (el canvas 1080 no soporta
   *  3 ni 5 forecasts sin romper el layout). */
  displayOrientation?: SignageOrientation;
}

export function HeaderTab({ client, displayOrientation = 'landscape' }: HeaderTabProps) {
  const draft = useThemeEditStore((s) => s.draft);
  const updateHeader = useThemeEditStore((s) => s.updateHeader);
  const h: SignageHeader = draft?.header ?? client.header;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">Header</h2>
        <p className="mt-1 text-[13px] text-zinc-500">
          Position, visibility y settings de reloj/clima del header del runtime.
        </p>
      </header>

      <Section title="Layout">
        <Field label="Position">
          <SegmentedToggle
            options={[
              { value: 'top', label: 'Top' },
              { value: 'bottom', label: 'Bottom' },
            ]}
            value={h.position}
            onChange={(v) => updateHeader({ position: v as SignageHeader['position'] })}
          />
        </Field>

        <Field label="Logo placement">
          <SegmentedToggle
            options={[
              { value: 'logo-left', label: 'Left' },
              { value: 'logo-center', label: 'Center' },
              { value: 'logo-right', label: 'Right' },
            ]}
            value={h.layout}
            onChange={(v) => updateHeader({ layout: v as SignageHeader['layout'] })}
          />
        </Field>

        <Field label="Weather placement">
          <SegmentedToggle
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
            value={h.weatherPlacement ?? 'center'}
            onChange={(v) =>
              updateHeader({
                weatherPlacement: v as SignageHeader['weatherPlacement'],
              })
            }
          />
        </Field>

        <Field label="Clock placement">
          <SegmentedToggle
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
            value={h.clockPlacement ?? 'right'}
            onChange={(v) =>
              updateHeader({
                clockPlacement: v as SignageHeader['clockPlacement'],
              })
            }
          />
        </Field>
      </Section>

      <Section title="Visible elements">
        <SwitchRow label="Logo" on={h.showLogo} onChange={(v) => updateHeader({ showLogo: v })} />
        <SwitchRow
          label="Weather"
          on={h.showWeather}
          onChange={(v) => updateHeader({ showWeather: v })}
        />
        <SwitchRow
          label="Clock"
          on={h.showClock}
          onChange={(v) => updateHeader({ showClock: v })}
        />
      </Section>

      <Section title="Clock & weather">
        <Field label="Clock format">
          <SegmentedToggle
            options={[
              { value: '12h', label: '12 h' },
              { value: '24h', label: '24 h' },
            ]}
            value={h.clockFormat}
            onChange={(v) => updateHeader({ clockFormat: v as SignageHeader['clockFormat'] })}
          />
        </Field>

        <Field label="Weather units">
          <SegmentedToggle
            options={[
              { value: 'metric', label: '°C' },
              { value: 'imperial', label: '°F' },
            ]}
            value={h.weatherUnits}
            onChange={(v) =>
              updateHeader({
                weatherUnits: v as SignageHeader['weatherUnits'],
              })
            }
          />
        </Field>

        <Field
          label="Forecast days"
          hint={
            displayOrientation === 'portrait'
              ? 'Portrait canvas (1080 ancho) solo aguanta 1 o 2 forecasts sin colisionar con clock y logo.'
              : undefined
          }
        >
          <SegmentedToggle
            options={
              displayOrientation === 'portrait'
                ? [
                    { value: '1', label: '1 day' },
                    { value: '2', label: '2 days' },
                  ]
                : [
                    { value: '1', label: '1 day' },
                    { value: '2', label: '2 days' },
                    { value: '3', label: '3 days' },
                    { value: '5', label: '5 days' },
                  ]
            }
            value={String(
              (() => {
                const v = (h.forecastDays as 0 | 1 | 2 | 3 | 5) === 0 ? 1 : h.forecastDays;
                if (displayOrientation === 'portrait' && (v === 3 || v === 5)) return 2;
                return v;
              })(),
            )}
            onChange={(v) =>
              updateHeader({
                forecastDays: Number(v) as SignageHeader['forecastDays'],
              })
            }
          />
        </Field>
      </Section>

      <Section title="Background" subtitle="Color sólido, gradient, o imagen">
        <BackgroundEditor
          background={h.background}
          onChange={(bg) => updateHeader({ background: bg })}
        />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Background editor
// ---------------------------------------------------------------------------

const BG_KINDS: ReadonlyArray<{
  value: SignageHeaderBackground['kind'];
  label: string;
}> = [
  { value: 'color', label: 'Color' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image' },
];

function BackgroundEditor({
  background,
  onChange,
}: {
  background: SignageHeaderBackground;
  onChange: (next: SignageHeaderBackground) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Kind">
        <SegmentedToggle
          options={BG_KINDS.map((b) => ({ value: b.value, label: b.label }))}
          value={background.kind}
          onChange={(v) => {
            if (v === background.kind) return;
            if (v === 'color') {
              onChange({
                kind: 'color',
                // Default a referencia al brand token: el header sigue
                // automáticamente los cambios de Branding tab a menos que
                // el operator escriba un color custom.
                color:
                  background.kind === 'gradient'
                    ? background.from
                    : 'hsl(var(--signage-header-bg))',
              });
            } else if (v === 'gradient') {
              onChange({
                kind: 'gradient',
                from: background.kind === 'color' ? background.color : 'hsl(211 100% 25%)',
                to: 'hsl(200 100% 50%)',
                angle: background.kind === 'gradient' ? (background.angle ?? 90) : 90,
              });
            } else {
              onChange({
                kind: 'image',
                src: background.kind === 'image' ? background.src : '',
              });
            }
          }}
        />
      </Field>

      {background.kind === 'color' ? (
        <>
          <CssColorPickerField
            label="Color"
            value={background.color}
            onChange={(v) => onChange({ kind: 'color', color: v })}
          />
          <button
            type="button"
            onClick={() => onChange({ kind: 'color', color: 'hsl(var(--signage-header-bg))' })}
            className="self-start text-[11.5px] font-medium text-zinc-500 underline-offset-2 transition hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Sincronizar con brand-primary (auto-update con Branding tab)
          </button>
        </>
      ) : null}

      {background.kind === 'gradient' ? (
        <>
          <CssColorPickerField
            label="From"
            value={background.from}
            onChange={(v) =>
              onChange({
                kind: 'gradient',
                from: v,
                to: background.to,
                angle: background.angle,
              })
            }
          />
          <CssColorPickerField
            label="To"
            value={background.to}
            onChange={(v) =>
              onChange({
                kind: 'gradient',
                from: background.from,
                to: v,
                angle: background.angle,
              })
            }
          />
          <Field label={`Angle ${background.angle ?? 90}°`}>
            <input
              type="range"
              min={0}
              max={359}
              value={background.angle ?? 90}
              onChange={(e) =>
                onChange({
                  kind: 'gradient',
                  from: background.from,
                  to: background.to,
                  angle: Number(e.target.value),
                })
              }
              className="w-32 accent-zinc-700 dark:accent-zinc-300"
            />
          </Field>
          <GradientPreview
            from={background.from}
            to={background.to}
            angle={background.angle ?? 90}
          />
        </>
      ) : null}

      {background.kind === 'image' ? (
        <SignageMediaField
          label="Image"
          hint="Imagen de fondo del header. Cae al color base si está vacío."
          aspect="12/1"
          kind="image"
          value={background.src}
          onChange={(next) => onChange({ kind: 'image', src: next?.src ?? '' })}
        />
      ) : null}
    </div>
  );
}

function GradientPreview({ from, to, angle }: { from: string; to: string; angle: number }) {
  return (
    <div
      className="h-12 w-full rounded-md border border-zinc-200 dark:border-zinc-800"
      style={{
        background: `linear-gradient(${angle}deg, ${from}, ${to})`,
      }}
      aria-hidden
    />
  );
}

/**
 * Color picker para una CSS color string libre (`hsl(...)` o `#hex`).
 *
 * El swatch es el toggle del popover: click abre, click fuera lo cierra. Esto
 * evita que el HslColorPicker sature el sidebar permanentemente y permite al
 * operator cerrar el panel cuando termina de afinar.
 */
function CssColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hsl = parseCssHsl(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cierra al click fuera + tecla Escape.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <div className="flex items-center justify-between gap-3 text-[12.5px]">
        <span className="text-zinc-500">{label}</span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? `Cerrar selector de ${label}` : `Abrir selector de ${label}`}
            aria-expanded={open}
            className="h-6 w-6 rounded border border-zinc-200 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800"
            style={{ backgroundColor: value || '#888' }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-44 rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11.5px] text-zinc-700 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            placeholder="hsl(H S% L%) or #rrggbb"
          />
        </span>
      </div>
      {open ? (
        <div className="absolute right-3 top-12 z-20 flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          {hsl ? (
            <>
              <HslColorPicker
                color={hsl}
                onChange={(c: HslColor) => onChange(formatCssHsl(c))}
                style={{ width: 200, height: 150 }}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Done
              </button>
            </>
          ) : (
            <p className="max-w-[200px] text-[11px] italic text-zinc-500">
              HSL formato `hsl(H S% L%)` activa el color picker visual.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function parseCssHsl(value: string): HslColor | null {
  const trimmed = value.trim();
  // hsl(H S% L%) or hsl(H, S%, L%)
  const hslMatch = trimmed.match(
    /^hsl\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)%\s*[, ]\s*(\d+(?:\.\d+)?)%\s*\)$/i,
  );
  if (hslMatch) {
    return {
      h: Math.round(Number(hslMatch[1])),
      s: Math.round(Number(hslMatch[2])),
      l: Math.round(Number(hslMatch[3])),
    };
  }
  // #RGB or #RRGGBB
  const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    let v = hexMatch[1];
    if (v.length === 3)
      v = v
        .split('')
        .map((c) => c + c)
        .join('');
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
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  return null;
}

function formatCssHsl(c: HslColor): string {
  return `hsl(${Math.round(c.h)} ${Math.round(c.s)}% ${Math.round(c.l)}%)`;
}

// ---------------------------------------------------------------------------
//  Primitives
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
  if (hint) {
    return (
      <div className="flex flex-col gap-1 text-[13px]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-500">{label}</span>
          <span className="flex shrink-0 items-center justify-end">{children}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">{hint}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 text-[13px]">
      <span className="text-zinc-500">{label}</span>
      <span className="flex shrink-0 items-center justify-end">{children}</span>
    </div>
  );
}

function SegmentedToggle({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded px-2.5 py-1 text-[11.5px] font-medium transition ${
              active
                ? 'bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SwitchRow({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 text-left text-[13px] last:border-0 last:pb-0 dark:border-zinc-900"
    >
      <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          on ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full shadow-sm transition-transform ${
            on
              ? 'translate-x-[18px] bg-white dark:bg-zinc-900'
              : 'translate-x-[2px] bg-white dark:bg-zinc-300'
          }`}
        />
      </span>
    </button>
  );
}
