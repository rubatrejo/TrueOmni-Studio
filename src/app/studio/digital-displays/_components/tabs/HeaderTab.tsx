'use client';

import type {
  SignageClientResolved,
  SignageHeader,
} from '@/lib/signage/schema';

import { useThemeEditStore } from '../../_lib/theme-edit-store';

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
}

export function HeaderTab({ client }: HeaderTabProps) {
  const draft = useThemeEditStore((s) => s.draft);
  const updateHeader = useThemeEditStore((s) => s.updateHeader);
  const h: SignageHeader = draft?.header ?? client.header;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
          Header
        </h2>
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

        <Field label="Height">
          <SegmentedToggle
            options={[
              { value: '80', label: '80px' },
              { value: '100', label: '100px' },
              { value: '120', label: '120px' },
            ]}
            value={String(h.height)}
            onChange={(v) =>
              updateHeader({
                height: Number(v) as SignageHeader['height'],
              })
            }
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
      </Section>

      <Section title="Visible elements">
        <SwitchRow
          label="Logo"
          on={h.showLogo}
          onChange={(v) => updateHeader({ showLogo: v })}
        />
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
            onChange={(v) =>
              updateHeader({ clockFormat: v as SignageHeader['clockFormat'] })
            }
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

        <Field label="Forecast days">
          <SegmentedToggle
            options={[
              { value: '0', label: 'None' },
              { value: '3', label: '3 days' },
              { value: '5', label: '5 days' },
            ]}
            value={String(h.forecastDays)}
            onChange={(v) =>
              updateHeader({
                forecastDays: Number(v) as SignageHeader['forecastDays'],
              })
            }
          />
        </Field>
      </Section>

      <Section title="Background" subtitle="Source de fondo del header">
        <Field label="Kind">
          <span className="rounded bg-zinc-100 px-2 py-1 font-mono text-[11.5px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {h.background.kind}
          </span>
        </Field>
        {h.background.kind === 'color' ? (
          <Field label="Color">
            <code className="font-mono text-[12px] text-zinc-700 dark:text-zinc-300">
              {h.background.color}
            </code>
          </Field>
        ) : null}
        {h.background.kind === 'gradient' ? (
          <>
            <Field label="From">
              <code className="font-mono text-[12px]">{h.background.from}</code>
            </Field>
            <Field label="To">
              <code className="font-mono text-[12px]">{h.background.to}</code>
            </Field>
          </>
        ) : null}
        {h.background.kind === 'image' ? (
          <Field label="Source">
            <code className="truncate font-mono text-[12px]">{h.background.src}</code>
          </Field>
        ) : null}
        <p className="text-[11px] italic text-zinc-400">
          Editor visual de gradient + upload de imagen aterriza con el asset
          endpoint.
        </p>
      </Section>
    </div>
  );
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
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
          on
            ? 'bg-emerald-500 dark:bg-emerald-400'
            : 'bg-zinc-200 dark:bg-zinc-800'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            on ? 'translate-x-[18px]' : 'translate-x-[2px]'
          }`}
        />
      </span>
    </button>
  );
}
