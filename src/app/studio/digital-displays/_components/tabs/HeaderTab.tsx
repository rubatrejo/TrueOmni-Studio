'use client';

import { Check, X } from 'lucide-react';

import type { SignageClientResolved } from '@/lib/signage/schema';

/**
 * Tab `Header` — read-only en DSS1. Muestra `client.header`:
 *  - position, height, layout, clockFormat, weatherUnits, forecastDays.
 *  - showLogo / showWeather / showClock como pills check/x.
 *  - background (kind + valor).
 *
 * En DSS5+ se reemplaza por toggles + selects editables.
 */
export interface HeaderTabProps {
  client: SignageClientResolved;
}

export function HeaderTab({ client }: HeaderTabProps) {
  const h = client.header;
  return (
    <div className="flex flex-col gap-8">
      <Section title="Layout">
        <DataRow label="Position" value={<Pill>{h.position}</Pill>} />
        <DataRow label="Height" value={<Pill>{h.height}px</Pill>} />
        <DataRow label="Logo placement" value={<Pill>{h.layout}</Pill>} />
      </Section>

      <Section title="Visible elements">
        <DataRow label="Logo" value={<Toggle on={h.showLogo} />} />
        <DataRow label="Weather" value={<Toggle on={h.showWeather} />} />
        <DataRow label="Clock" value={<Toggle on={h.showClock} />} />
      </Section>

      <Section title="Clock & weather settings">
        <DataRow label="Clock format" value={<Pill>{h.clockFormat}</Pill>} />
        <DataRow label="Weather units" value={<Pill>{h.weatherUnits}</Pill>} />
        <DataRow label="Forecast days" value={<Pill>{h.forecastDays}</Pill>} />
      </Section>

      <Section title="Background">
        <DataRow label="Kind" value={<Pill>{h.background.kind}</Pill>} />
        {h.background.kind === 'color' ? (
          <DataRow
            label="Color"
            value={<code className="font-mono text-[12px]">{h.background.color}</code>}
          />
        ) : null}
        {h.background.kind === 'gradient' ? (
          <>
            <DataRow
              label="From"
              value={<code className="font-mono text-[12px]">{h.background.from}</code>}
            />
            <DataRow
              label="To"
              value={<code className="font-mono text-[12px]">{h.background.to}</code>}
            />
            {typeof h.background.angle === 'number' ? (
              <DataRow label="Angle" value={<Pill>{h.background.angle}°</Pill>} />
            ) : null}
          </>
        ) : null}
        {h.background.kind === 'image' ? (
          <DataRow
            label="Source"
            value={<code className="font-mono text-[12px]">{h.background.src}</code>}
          />
        ) : null}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
        {title}
      </h3>
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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11.5px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      {children}
    </span>
  );
}

function Toggle({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
      <Check className="h-3 w-3" strokeWidth={2.5} />
      enabled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[11.5px] font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
      <X className="h-3 w-3" strokeWidth={2.5} />
      disabled
    </span>
  );
}
