'use client';

import { useMemo, useState } from 'react';

import { translateI18nBulk } from '@/app/studio/_lib/api-client';
import type { PwaConfig } from '@/lib/config';
import { LOCALE_LABELS } from '@/lib/i18n';
import { extractTranslatablePaths } from '@/lib/pwa-i18n';

import { PwaPanelHeader } from './pwa-ui';

/**
 * Editor i18n del slice PWA. Lista los textos traducibles (dot-paths derivados de
 * `features.pwa.*`) y permite traducirlos por locale, guardándolos en
 * `features.pwa.i18n[locale][path]`. El idioma base (en) es el propio slice y solo
 * se muestra como referencia. Reutiliza el endpoint de traducción del kiosk
 * (DeepL + Anthropic) vía `translateI18nBulk`.
 *
 * En runtime, el slice se resuelve para el locale activo (`resolvePwaForLocale`,
 * cookie + recarga) y las pantallas lo muestran vía el bridge — sin tocar páginas.
 */

const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'fr', 'de', 'pt', 'ja'] as const;

export function PwaI18nEditor({
  value,
  onChange,
}: {
  value: PwaConfig;
  onChange: (next: PwaConfig) => void;
}) {
  const [target, setTarget] = useState<string>(TARGET_LOCALES[0]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paths = useMemo(() => extractTranslatablePaths(value), [value]);
  const overlay = value.i18n?.[target] ?? {};

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return paths;
    return paths.filter(
      (p) => p.path.toLowerCase().includes(q) || p.value.toLowerCase().includes(q),
    );
  }, [paths, search]);

  const missingCount = paths.filter((p) => !(overlay[p.path] ?? '').trim()).length;

  const setCell = (path: string, text: string) =>
    onChange({
      ...value,
      i18n: { ...value.i18n, [target]: { ...(value.i18n?.[target] ?? {}), [path]: text } },
    });

  const autoTranslate = async () => {
    const missing = paths.filter((p) => !(overlay[p.path] ?? '').trim());
    if (missing.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await translateI18nBulk({
        fromLocale: BASE_LOCALE,
        toLocale: target,
        items: missing.map((p) => ({ key: p.path, text: p.value, context: p.path })),
      });
      const next = { ...(value.i18n?.[target] ?? {}) };
      for (const t of res.translations) {
        if (t.translation) next[t.key] = t.translation;
      }
      onChange({ ...value, i18n: { ...value.i18n, [target]: next } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Translation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Languages"
        description="Translate the mobile app texts per language. The base language is the slice itself; translations are applied at runtime when the user switches language."
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-6">
        {/* Locale tabs + acciones */}
        <div className="flex flex-wrap items-center gap-2">
          {TARGET_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setTarget(l)}
              className={
                'rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ' +
                (l === target
                  ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200')
              }
            >
              {LOCALE_LABELS[l] ?? l}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500">
            {missingCount} missing
          </span>
          <button
            type="button"
            onClick={autoTranslate}
            disabled={busy || missingCount === 0}
            className="flex items-center gap-1 rounded-md bg-sky-500/15 px-2.5 py-1.5 text-[11.5px] font-medium text-sky-700 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-300"
          >
            {busy ? 'Translating…' : '✨ Auto-translate empty'}
          </button>
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by path or text…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12.5px] text-zinc-900 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        />

        {/* Lista de paths */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="text-[12px] italic text-zinc-400">No translatable texts match.</p>
          ) : (
            visible.map((p) => (
              <label key={p.path} className="block">
                <span className="mb-1 flex items-baseline gap-2">
                  <span className="font-mono text-[10.5px] text-zinc-400 dark:text-zinc-500">
                    {p.path}
                  </span>
                </span>
                <span className="mb-1 block truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
                  {p.value}
                </span>
                <input
                  type="text"
                  value={overlay[p.path] ?? ''}
                  onChange={(e) => setCell(p.path, e.target.value)}
                  placeholder={`${LOCALE_LABELS[target] ?? target}…`}
                  className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
