'use client';

import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { SignageEvent } from '@/lib/signage/schema';

import { saveSignageEvents } from '../../_lib/save-content';
import { SignageMediaField } from '../display/modules/SignageMediaField';

/**
 * `<EventsTab>` — CRUD inline de events del theme signage.
 *
 * Events viven a nivel cliente (compartidos entre todos los displays).
 * Cada cambio se guarda al KV con debounce 800ms; el runtime ya lee KV-first.
 *
 * Para feedback live el operator debe recargar el iframe del preview tras
 * editar un evento — el bridge no propaga events (lo hace el SSR del iframe).
 */
export interface EventsTabProps {
  clientSlug: string;
  initialEvents: readonly SignageEvent[];
}

const CATEGORIES = [
  { value: '', label: '(none)' },
  { value: 'wellness', label: 'wellness' },
  { value: 'sports', label: 'sports' },
  { value: 'music', label: 'music' },
  { value: 'community', label: 'community' },
  { value: 'food', label: 'food' },
  { value: 'arts', label: 'arts' },
  { value: 'business', label: 'business' },
];

function nextId(): string {
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function toLocalInput(iso: string): string {
  // Acepta ISO-like; lo recortamos al shape del input datetime-local.
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
}

export function EventsTab({ clientSlug, initialEvents }: EventsTabProps) {
  const [events, setEvents] = useState<SignageEvent[]>([...initialEvents]);
  const [expanded, setExpanded] = useState<string | null>(events[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Debounced autosave 800ms.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  const persist = useCallback(
    async (next: SignageEvent[]) => {
      setSaving(true);
      setError(null);
      const res = await saveSignageEvents(clientSlug, next);
      if (res.ok) {
        setSavedAt(res.savedAt);
        dirtyRef.current = false;
      } else {
        setError(res.error);
      }
      setSaving(false);
    },
    [clientSlug],
  );

  function scheduleSave(next: SignageEvent[]) {
    dirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(next);
    }, 800);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function update(id: string, patch: Partial<SignageEvent>) {
    setEvents((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
      scheduleSave(next);
      return next;
    });
  }

  function remove(id: string) {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      scheduleSave(next);
      return next;
    });
    if (expanded === id) setExpanded(null);
  }

  function add() {
    const id = nextId();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const startsAt = tomorrow.toISOString().slice(0, 16);
    const item: SignageEvent = {
      id,
      title: 'New event',
      startsAt,
      location: 'Location',
    };
    setEvents((prev) => {
      const next = [item, ...prev];
      scheduleSave(next);
      return next;
    });
    setExpanded(id);
  }

  function move(id: string, dir: -1 | 1) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      scheduleSave(next);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            Events
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            {events.length} event{events.length === 1 ? '' : 's'} · shared across every display in this theme
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Add event
        </button>
      </header>

      {events.length === 0 ? (
        <button
          type="button"
          onClick={add}
          className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center transition hover:border-sky-400 hover:bg-sky-50/50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-sky-500/50 dark:hover:bg-sky-950/20"
        >
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            No events yet
          </p>
          <p className="mt-1 text-[12.5px] text-zinc-500">
            Click to add the first one.
          </p>
        </button>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((e, idx) => {
            const isOpen = expanded === e.id;
            return (
              <li
                key={e.id}
                className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                      {e.title || '(untitled)'}
                    </span>
                    {e.startsAt ? (
                      <span className="font-mono text-[11px] text-zinc-400">
                        {e.startsAt.slice(0, 10)}
                      </span>
                    ) : null}
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      title="Move up"
                      disabled={idx === 0}
                      onClick={() => move(e.id, -1)}
                      className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      disabled={idx === events.length - 1}
                      onClick={() => move(e.id, 1)}
                      className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete event"
                      onClick={() => remove(e.id)}
                      className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {isOpen ? (
                  <div className="flex flex-col gap-3 border-t border-zinc-100 px-3 py-3 dark:border-zinc-900">
                    <FieldText
                      label="Title"
                      value={e.title}
                      onChange={(v) => update(e.id, { title: v })}
                    />
                    <FieldDateTime
                      label="Starts at"
                      value={toLocalInput(e.startsAt)}
                      onChange={(v) => update(e.id, { startsAt: v })}
                    />
                    <FieldText
                      label="Location"
                      value={e.location ?? ''}
                      placeholder="(optional)"
                      onChange={(v) =>
                        update(e.id, { location: v || undefined })
                      }
                    />
                    <FieldSelect
                      label="Category"
                      value={e.category ?? ''}
                      options={CATEGORIES}
                      onChange={(v) =>
                        update(e.id, { category: v || undefined })
                      }
                    />
                    <SignageMediaField
                      label="Image"
                      hint="Imagen del evento (path o URL)."
                      aspect="16/9"
                      kind="image"
                      value={e.image ?? ''}
                      onChange={(next) =>
                        update(e.id, { image: next?.src || undefined })
                      }
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <footer className="flex items-center gap-3 text-[11.5px] text-zinc-500">
        {saving ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </span>
        ) : error ? (
          <span className="text-red-600 dark:text-red-400">⚠ {error}</span>
        ) : savedAt ? (
          <span>
            Saved {new Date(savedAt).toLocaleTimeString()}
          </span>
        ) : (
          <span>Idle · auto-saves 800ms after last edit</span>
        )}
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Tiny field primitives (locales para evitar prop drilling)
// ---------------------------------------------------------------------------

function FieldText({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      />
    </label>
  );
}

function FieldDateTime({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-[12px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
