'use client';

import { Check, X } from 'lucide-react';

import { useDisplayEditStore } from '../../_lib/display-edit-store';

/**
 * `<DisplaySettingsPanel>` editable (DSS4).
 *
 * Cada change dispatcha `updateSettings` al store. El bridge push y el
 * autosave reaccionan al cambio de `displayDraft` desde el editor parent.
 */
export function DisplaySettingsPanel() {
  const settings = useDisplayEditStore((s) => s.draft?.settings ?? null);
  const updateSettings = useDisplayEditStore((s) => s.updateSettings);

  if (!settings) {
    return null;
  }

  const sleep = settings.sleepSchedule;
  const sleepEnabled = sleep?.enabled ?? false;
  const sleepStart = sleep?.startTime ?? '23:00';
  const sleepEnd = sleep?.endTime ?? '06:00';

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-4">
        <h3 className="font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
          Settings
        </h3>
        <p className="mt-0.5 text-[11.5px] text-zinc-500">Cambios se guardan automáticamente</p>
      </header>

      <div className="flex flex-col gap-3">
        <Field label="Resolution">
          <select
            value={settings.targetResolution}
            onChange={(e) =>
              updateSettings({
                targetResolution: e.target.value as '1080p' | '4k',
              })
            }
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="1080p">1080p</option>
            <option value="4k">4k</option>
          </select>
        </Field>

        <Field label="Audio">
          <button
            type="button"
            onClick={() => updateSettings({ audio: !settings.audio })}
            className={
              settings.audio
                ? 'inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11.5px] font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-500 transition hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }
          >
            {settings.audio ? (
              <>
                <Check className="h-3 w-3" strokeWidth={2.5} />
                enabled
              </>
            ) : (
              <>
                <X className="h-3 w-3" strokeWidth={2.5} />
                disabled
              </>
            )}
          </button>
        </Field>

        <Field label="Default duration (s)">
          <input
            type="number"
            min="1"
            max="600"
            step="0.5"
            value={(settings.defaultDurationMs / 1000).toString()}
            onChange={(e) => {
              const seconds = parseFloat(e.target.value);
              if (Number.isNaN(seconds)) return;
              updateSettings({
                defaultDurationMs: Math.round(Math.min(Math.max(seconds, 1), 600) * 1000),
              });
            }}
            className="w-24 rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          />
        </Field>

        <Field label="Default transition">
          <select
            value={settings.defaultTransition}
            onChange={(e) =>
              updateSettings({
                defaultTransition: e.target.value as 'cut' | 'fade' | 'slide-left' | 'slide-up',
              })
            }
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="cut">cut</option>
            <option value="fade">fade</option>
            <option value="slide-left">slide-left</option>
            <option value="slide-up">slide-up</option>
          </select>
        </Field>

        <div className="border-t border-zinc-100 pt-3 dark:border-zinc-900">
          <Field label="Sleep schedule">
            <button
              type="button"
              onClick={() =>
                updateSettings({
                  sleepSchedule: {
                    enabled: !sleepEnabled,
                    startTime: sleepStart,
                    endTime: sleepEnd,
                  },
                })
              }
              className={
                sleepEnabled
                  ? 'inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11.5px] font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-500 transition hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }
            >
              {sleepEnabled ? (
                <>
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  enabled
                </>
              ) : (
                <>
                  <X className="h-3 w-3" strokeWidth={2.5} />
                  disabled
                </>
              )}
            </button>
          </Field>
          {sleepEnabled ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Start">
                <input
                  type="time"
                  value={sleepStart}
                  onChange={(e) =>
                    updateSettings({
                      sleepSchedule: {
                        enabled: true,
                        startTime: e.target.value,
                        endTime: sleepEnd,
                      },
                    })
                  }
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                />
              </Field>
              <Field label="End">
                <input
                  type="time"
                  value={sleepEnd}
                  onChange={(e) =>
                    updateSettings({
                      sleepSchedule: {
                        enabled: true,
                        startTime: sleepStart,
                        endTime: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                />
              </Field>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-zinc-500">{label}</span>
      <span className="flex-shrink-0">{children}</span>
    </label>
  );
}
