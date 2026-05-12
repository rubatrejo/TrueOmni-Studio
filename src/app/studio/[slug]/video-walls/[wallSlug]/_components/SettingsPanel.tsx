'use client';

import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { VideoWallConfig } from '@/lib/video-walls/schema';

/**
 * VW7 — tab Settings del wall. Edita:
 *   - defaultDurationMs (slider 2-30s)
 *   - defaultTransition (cut / fade / slide-left / slide-up)
 *   - audio toggle
 *   - sleepSchedule (enabled / startTime / endTime)
 *
 * Autosave PUT con 800ms debounce.
 */
export interface SettingsPanelProps {
  clientSlug: string;
  wall: VideoWallConfig;
  onWallChange: (next: VideoWallConfig) => void;
}

export function SettingsPanel({ clientSlug, wall, onWallChange }: SettingsPanelProps) {
  const [draft, setDraft] = useState<VideoWallConfig>(wall);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(wall);
  }, [wall]);

  useEffect(() => {
    if (draft === wall) return;
    const t = window.setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/studio/video-walls/walls/${clientSlug}/${wall.slug}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ wall: draft }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        onWallChange(draft);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => window.clearTimeout(t);
  }, [draft, wall, clientSlug, onWallChange]);

  const set = useCallback(
    (mut: (d: VideoWallConfig) => VideoWallConfig) => setDraft((d) => mut(d)),
    [],
  );

  const sleep = draft.settings.sleepSchedule ?? {
    enabled: false,
    startTime: '23:00',
    endTime: '06:00',
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">Wall settings</div>
        <div className="text-[11px]">
          {saving && (
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving
            </span>
          )}
          {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto p-4 text-[12px]">
        <Field label="Default slide duration">
          <input
            type="range"
            min={2000}
            max={30000}
            step={500}
            value={draft.settings.defaultDurationMs}
            onChange={(e) =>
              set((d) => ({
                ...d,
                settings: { ...d.settings, defaultDurationMs: Number(e.target.value) },
              }))
            }
            className="w-full"
          />
          <span className="ml-2 font-mono text-zinc-600 dark:text-zinc-400">
            {(draft.settings.defaultDurationMs / 1000).toFixed(1)}s
          </span>
        </Field>

        <Field label="Default transition">
          <div className="flex gap-1.5">
            {(['cut', 'fade', 'slide-left', 'slide-up'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  set((d) => ({
                    ...d,
                    settings: { ...d.settings, defaultTransition: t },
                  }))
                }
                className={`rounded border px-2 py-1 font-mono text-[10.5px] transition ${
                  draft.settings.defaultTransition === t
                    ? 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Audio">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.settings.audio}
              onChange={(e) =>
                set((d) => ({ ...d, settings: { ...d.settings, audio: e.target.checked } }))
              }
            />
            <span className="text-zinc-700 dark:text-zinc-300">Enable audio on video slides</span>
          </label>
        </Field>

        <Field label="Sleep schedule">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={sleep.enabled}
              onChange={(e) =>
                set((d) => ({
                  ...d,
                  settings: {
                    ...d.settings,
                    sleepSchedule: { ...sleep, enabled: e.target.checked },
                  },
                }))
              }
            />
            <span className="text-zinc-700 dark:text-zinc-300">Enable nightly sleep</span>
          </label>
          {sleep.enabled && (
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <input
                type="time"
                value={sleep.startTime}
                onChange={(e) =>
                  set((d) => ({
                    ...d,
                    settings: {
                      ...d.settings,
                      sleepSchedule: { ...sleep, startTime: e.target.value },
                    },
                  }))
                }
                className="rounded border border-zinc-200 bg-white px-2 py-1 font-mono dark:border-zinc-700 dark:bg-zinc-950"
              />
              <span className="text-zinc-500">→</span>
              <input
                type="time"
                value={sleep.endTime}
                onChange={(e) =>
                  set((d) => ({
                    ...d,
                    settings: {
                      ...d.settings,
                      sleepSchedule: { ...sleep, endTime: e.target.value },
                    },
                  }))
                }
                className="rounded border border-zinc-200 bg-white px-2 py-1 font-mono dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          )}
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      {children}
    </div>
  );
}
