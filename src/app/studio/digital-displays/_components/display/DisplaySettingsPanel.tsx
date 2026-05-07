'use client';

import { Check, X } from 'lucide-react';

import type { SignageDisplaySettings } from '@/lib/signage/schema';

/**
 * `<DisplaySettingsPanel>` — Read-only en DSS2.
 *
 * Muestra `display.settings`:
 *  - targetResolution (1080p | 4k).
 *  - audio (enabled / disabled chip).
 *  - defaultDurationMs (segundos).
 *  - defaultTransition (cut | fade | slide-left | slide-up).
 *  - sleepSchedule (si enabled): start–end + days.
 *
 * Edición en DSS4 con primitivas Field/TextInput/Select.
 */
export interface DisplaySettingsPanelProps {
  settings: SignageDisplaySettings;
}

export function DisplaySettingsPanel({ settings }: DisplaySettingsPanelProps) {
  const sleep = settings.sleepSchedule;
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-4">
        <h3 className="font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
          Settings
        </h3>
        <p className="mt-0.5 text-[11.5px] text-zinc-500">Read-only · edit in DSS4</p>
      </header>

      <div className="flex flex-col gap-2">
        <DataRow
          label="Resolution"
          value={<Pill>{settings.targetResolution}</Pill>}
        />
        <DataRow label="Audio" value={<Toggle on={settings.audio} />} />
        <DataRow
          label="Default slide duration"
          value={<Pill>{(settings.defaultDurationMs / 1000).toFixed(1)}s</Pill>}
        />
        <DataRow
          label="Default transition"
          value={<Pill>{settings.defaultTransition}</Pill>}
        />
        <DataRow
          label="Sleep schedule"
          value={
            sleep?.enabled ? (
              <span className="inline-flex items-center gap-1.5 text-[11.5px]">
                <Pill>{sleep.startTime}</Pill>
                <span className="text-zinc-400 dark:text-zinc-600">→</span>
                <Pill>{sleep.endTime}</Pill>
              </span>
            ) : (
              <span className="text-[11.5px] italic text-zinc-400">disabled</span>
            )
          }
        />
      </div>
    </section>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 text-[12.5px] last:border-0 last:pb-0 dark:border-zinc-900">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      {children}
    </span>
  );
}

function Toggle({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
      <Check className="h-3 w-3" strokeWidth={2.5} />
      enabled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
      <X className="h-3 w-3" strokeWidth={2.5} />
      disabled
    </span>
  );
}
