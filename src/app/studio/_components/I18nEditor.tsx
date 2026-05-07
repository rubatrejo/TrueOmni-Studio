'use client';

import { Languages, Loader2, Plus, Search, Sparkles, Star, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getLocaleInfo } from '@/lib/studio/locale-catalog';
import {
  type I18nBundle,
  type Locale,
  type LocaleStrings,
} from '@/lib/studio/schema';

import {
  getTranslateStatus,
  translateI18nBulk,
  translateI18nText,
} from '../_lib/api-client';

import { AddLanguageModal } from './AddLanguageModal';

interface I18nEditorProps {
  value: I18nBundle;
  onChange: (next: I18nBundle) => void;
}

const SECTION_FALLBACK = 'misc';

export function I18nEditor({ value, onChange }: I18nEditorProps) {
  const [section, setSection] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiProvider, setAiProvider] = useState<'deepl' | 'anthropic' | null>(null);
  const [bulkRunning, setBulkRunning] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [addLanguageOpen, setAddLanguageOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTranslateStatus()
      .then((s) => {
        if (!cancelled) {
          setAiAvailable(s.available);
          setAiProvider(s.provider);
        }
      })
      .catch(() => {
        if (!cancelled) setAiAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Lista dinámica de locales presentes en el bundle. `en` siempre primero
   * (canonical), luego el resto en orden alfabético. Si el operador añade
   * un locale nuevo desde el modal, aparece automáticamente.
   */
  const localeList = useMemo<readonly Locale[]>(() => {
    const keys = Object.keys(value);
    if (!keys.includes('en')) keys.unshift('en');
    return [
      'en',
      ...keys.filter((k) => k !== 'en').sort((a, b) => a.localeCompare(b)),
    ];
  }, [value]);

  const allKeys = useMemo(() => {
    const set = new Set<string>();
    for (const locale of localeList) {
      const localeStrings = value[locale];
      if (localeStrings) Object.keys(localeStrings).forEach((k) => set.add(k));
    }
    return Array.from(set).sort();
  }, [value, localeList]);

  const sections = useMemo(() => {
    const map = new Map<string, number>();
    for (const key of allKeys) {
      const prefix = key.split('_')[0] || SECTION_FALLBACK;
      map.set(prefix, (map.get(prefix) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allKeys]);

  const visibleKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Audit F-24: el filter acepta `missing-in-{locale}` además de los
    // section prefixes. Cuando se selecciona un missing filter, devolvemos
    // solo keys con EN no-vacío y locale objetivo vacío.
    const missingForLocale = section.startsWith('missing-in-')
      ? section.slice('missing-in-'.length)
      : null;
    return allKeys.filter((key) => {
      if (missingForLocale) {
        const enValue = value.en?.[key];
        if (!enValue) return false;
        const localeValue = value[missingForLocale]?.[key];
        if (localeValue && localeValue.trim() !== '') return false;
      } else if (section !== 'all') {
        const prefix = key.split('_')[0] || SECTION_FALLBACK;
        if (prefix !== section) return false;
      }
      if (!q) return true;
      if (key.toLowerCase().includes(q)) return true;
      return localeList.some((loc) =>
        (value[loc]?.[key] ?? '').toLowerCase().includes(q),
      );
    });
  }, [allKeys, section, search, value, localeList]);

  const missingByLocale = useMemo(() => {
    const result: Record<string, number> = {};
    for (const loc of localeList) result[loc] = 0;
    for (const key of allKeys) {
      const enValue = value.en?.[key];
      if (!enValue) continue; // si EN tampoco la tiene, no es "missing" técnicamente
      for (const loc of localeList) {
        if (loc === 'en') continue;
        const v = value[loc]?.[key];
        if (!v || v.trim() === '') {
          result[loc]++;
        }
      }
    }
    return result;
  }, [allKeys, value, localeList]);

  const updateCell = (locale: Locale, key: string, next: string) => {
    const current = value[locale]?.[key] ?? '';
    if (current === next) return;
    const nextLocale: LocaleStrings = { ...(value[locale] ?? {}) };
    if (next === '') {
      delete nextLocale[key];
    } else {
      nextLocale[key] = next;
    }
    onChange({ ...value, [locale]: nextLocale });
  };

  const handleAddKey = () => {
    const raw = window.prompt(
      'New i18n key (snake_case, lowercase, e.g. "tile_label_my_module")',
    );
    if (!raw) return;
    const key = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!key) return;
    if (allKeys.includes(key)) {
      window.alert(`Key "${key}" already exists.`);
      return;
    }
    onChange({
      ...value,
      en: { ...(value.en ?? {}), [key]: '' },
    });
    setSection('all');
    setSearch(key);
  };

  const handleAddLanguage = (code: string) => {
    if (value[code]) return; // ya existe, no-op
    onChange({ ...value, [code]: {} });
  };

  const handleRemoveLanguage = (code: string) => {
    if (code === 'en') return; // canonical, nunca se borra
    const info = getLocaleInfo(code);
    const ok = window.confirm(
      `Remove "${info.englishName}" (${code.toUpperCase()})?\n\n` +
        `This will permanently delete all translations for this locale. ` +
        `You can re-add it later but you'll start with empty cells.`,
    );
    if (!ok) return;
    const next = { ...value };
    delete next[code];
    onChange(next);
  };

  /**
   * Auto-translate de TODAS las missing keys de un locale objetivo. Toma EN
   * como source. Trocea en chunks de 50 para respetar el límite del endpoint
   * bulk. Aplica resultados de manera incremental al bundle (no espera a
   * todos los chunks para que el operador vea progreso).
   */
  const handleBulkTranslate = async (toLocale: string) => {
    if (toLocale === 'en') return;
    if (bulkRunning) return;
    setTranslateError(null);

    // Encontrar las missing keys: tienen EN no vacío y target vacío.
    const missingKeys = allKeys.filter((key) => {
      const enVal = value.en?.[key];
      if (!enVal) return false;
      const tVal = value[toLocale]?.[key];
      return !tVal || tVal.trim() === '';
    });
    if (missingKeys.length === 0) return;

    setBulkRunning(toLocale);
    setBulkProgress({ done: 0, total: missingKeys.length });

    try {
      const CHUNK = 50;
      let next: I18nBundle = value;
      for (let i = 0; i < missingKeys.length; i += CHUNK) {
        const chunk = missingKeys.slice(i, i + CHUNK);
        const items = chunk.map((key) => ({
          key,
          text: value.en?.[key] ?? '',
        }));
        const res = await translateI18nBulk({
          fromLocale: 'en',
          toLocale,
          items,
        });
        // Aplicar incrementalmente
        const existing = { ...(next[toLocale] ?? {}) };
        for (const r of res.translations) {
          if (r.translation && r.translation.trim() !== '') {
            existing[r.key] = r.translation;
          }
        }
        next = { ...next, [toLocale]: existing };
        onChange(next);
        setBulkProgress({
          done: Math.min(i + CHUNK, missingKeys.length),
          total: missingKeys.length,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk translate failed';
      setTranslateError(message);
    } finally {
      setBulkRunning(null);
      setBulkProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-950">
          <Search className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search key or value…"
            className="flex-1 bg-transparent py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        </div>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          aria-label="Filter by section"
          className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11.5px] text-zinc-700 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          <option value="all">All sections ({allKeys.length})</option>
          {/* Filter por missing keys per locale (audit F-24). Solo mostramos
              locales con count > 0 para no llenar el dropdown con ceros. */}
          {localeList
            .filter((loc) => loc !== 'en' && (missingByLocale[loc] ?? 0) > 0)
            .map((loc) => (
              <option key={`missing-${loc}`} value={`missing-in-${loc}`}>
                Missing in {loc.toUpperCase()} ({missingByLocale[loc]})
              </option>
            ))}
          {sections.map(([prefix, count]) => (
            <option key={prefix} value={prefix}>
              {prefix} ({count})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setAddLanguageOpen(true)}
          className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <Languages className="h-3.5 w-3.5" />
          Add language
        </button>
        <button
          type="button"
          onClick={handleAddKey}
          className="flex items-center gap-1 rounded-md bg-sky-500/15 px-2.5 py-1.5 text-[11.5px] font-medium text-sky-700 transition hover:bg-sky-500/25 dark:text-sky-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add key
        </button>
      </div>

      <MissingSummary
        missing={missingByLocale}
        localeList={localeList}
        aiAvailable={aiAvailable}
        aiProvider={aiProvider}
        bulkRunning={bulkRunning}
        bulkProgress={bulkProgress}
        onBulkTranslate={handleBulkTranslate}
      />

      {translateError ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50/70 px-3 py-2 text-[11.5px] text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
        >
          <span>
            <strong>Translate failed:</strong> {translateError}
          </span>
          <button
            type="button"
            onClick={() => setTranslateError(null)}
            aria-label="Dismiss"
            className="font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-300"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full table-auto text-left text-[12px]">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            <tr>
              <th className="min-w-[180px] px-2 py-2 font-medium">Key</th>
              {localeList.map((loc) => {
                const info = getLocaleInfo(loc);
                return (
                  <th
                    key={loc}
                    className="min-w-[160px] px-2 py-2 font-medium"
                  >
                    <span className="flex items-center gap-1">
                      <span className="font-mono text-[10.5px] uppercase">{loc}</span>
                      <span className="truncate text-[10px] text-zinc-500" title={info.nativeName}>
                        {info.nativeName}
                      </span>
                      {loc === 'en' ? (
                        <Star
                          className="ml-0.5 h-3 w-3 fill-amber-400 text-amber-400"
                          aria-label="canonical"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(loc)}
                          aria-label={`Remove ${info.englishName}`}
                          title={`Remove ${info.englishName}`}
                          className="ml-auto grid h-4 w-4 place-items-center rounded text-zinc-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visibleKeys.length === 0 ? (
              <tr>
                <td
                  colSpan={localeList.length + 1}
                  className="px-3 py-8 text-center text-[12px] italic text-zinc-500"
                >
                  No keys match the current filter.
                </td>
              </tr>
            ) : (
              visibleKeys.map((key) => (
                <I18nRow
                  key={key}
                  k={key}
                  bundle={value}
                  localeList={localeList}
                  onChangeCell={updateCell}
                  onTranslateError={setTranslateError}
                  aiAvailable={aiAvailable}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddLanguageModal
        open={addLanguageOpen}
        existingLocales={localeList}
        onClose={() => setAddLanguageOpen(false)}
        onAdd={handleAddLanguage}
      />
    </div>
  );
}

function MissingSummary({
  missing,
  localeList,
  aiAvailable,
  aiProvider,
  bulkRunning,
  bulkProgress,
  onBulkTranslate,
}: {
  missing: Record<string, number>;
  localeList: readonly Locale[];
  aiAvailable: boolean;
  aiProvider: 'deepl' | 'anthropic' | null;
  bulkRunning: string | null;
  bulkProgress: { done: number; total: number } | null;
  onBulkTranslate: (toLocale: string) => void;
}) {
  const total = localeList.reduce(
    (acc, loc) => acc + (loc === 'en' ? 0 : missing[loc] ?? 0),
    0,
  );
  if (total === 0) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[11.5px] text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
        ✓ All locales fully translated against EN.
      </p>
    );
  }
  const providerLabel =
    aiProvider === 'deepl' ? 'DeepL' : aiProvider === 'anthropic' ? 'Claude' : null;
  return (
    <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
      <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-amber-900 dark:text-amber-200">
        <span className="font-semibold">Missing translations:</span>
        {localeList.filter((l) => l !== 'en').map((loc) => {
          const count = missing[loc] ?? 0;
          const isRunning = bulkRunning === loc;
          const canTranslate = aiAvailable && count > 0 && !bulkRunning;
          return (
            <span key={loc} className="inline-flex items-center gap-1">
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
                  count > 0
                    ? 'bg-amber-200/70 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100'
                    : 'bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100'
                }`}
              >
                {loc.toUpperCase()} {count}
              </span>
              {count > 0 && aiAvailable ? (
                <button
                  type="button"
                  disabled={!canTranslate}
                  onClick={() => onBulkTranslate(loc)}
                  title={
                    isRunning
                      ? `Translating ${bulkProgress?.done ?? 0}/${bulkProgress?.total ?? count}…`
                      : `Auto-translate ${count} missing key${count === 1 ? '' : 's'} to ${loc.toUpperCase()} via ${providerLabel}`
                  }
                  className="inline-flex items-center gap-1 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-sky-700 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
                >
                  {isRunning ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-2.5 w-2.5" />
                  )}
                  {isRunning ? 'Translating…' : 'Auto'}
                </button>
              ) : null}
            </span>
          );
        })}
      </div>
      {aiAvailable && providerLabel ? (
        <p className="text-[10.5px] text-amber-800/80 dark:text-amber-300/70">
          Powered by <strong>{providerLabel}</strong>
          {bulkRunning && bulkProgress
            ? ` · Translating ${bulkProgress.done}/${bulkProgress.total} keys…`
            : ' · Click Auto to bulk-translate missing keys per locale.'}
        </p>
      ) : !aiAvailable ? (
        <p className="text-[10.5px] text-amber-800/80 dark:text-amber-300/70">
          Set <code className="font-mono">DEEPL_API_KEY</code> in <code className="font-mono">.env.local</code> to enable bulk auto-translate.
        </p>
      ) : null}
    </div>
  );
}

function I18nRow({
  k,
  bundle,
  localeList,
  onChangeCell,
  onTranslateError,
  aiAvailable,
}: {
  k: string;
  bundle: I18nBundle;
  localeList: readonly Locale[];
  onChangeCell: (locale: Locale, key: string, next: string) => void;
  onTranslateError: (msg: string) => void;
  aiAvailable: boolean;
}) {
  const enValue = bundle.en?.[k] ?? '';
  return (
    <tr className="align-top">
      <td className="px-2 py-1.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
        <span className="break-all">{k}</span>
      </td>
      {localeList.map((loc) => {
        const cellValue = bundle[loc]?.[k] ?? '';
        return (
          <td key={loc} className="px-1.5 py-1.5">
            <I18nCell
              value={cellValue}
              onCommit={(next) => onChangeCell(loc, k, next)}
              ariaLabel={`${k} in ${loc}`}
              missing={
                loc !== 'en' && !!enValue && (!cellValue || cellValue.trim() === '')
              }
              translateInput={
                aiAvailable && loc !== 'en' && enValue
                  ? { sourceText: enValue, fromLocale: 'en', toLocale: loc, key: k }
                  : null
              }
              onTranslateError={onTranslateError}
            />
          </td>
        );
      })}
    </tr>
  );
}

interface TranslateInput {
  sourceText: string;
  fromLocale: Locale;
  toLocale: Locale;
  key: string;
}

function I18nCell({
  value,
  onCommit,
  ariaLabel,
  missing,
  translateInput,
  onTranslateError,
}: {
  value: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  missing: boolean;
  translateInput: TranslateInput | null;
  onTranslateError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [translating, setTranslating] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  if (value !== draft && document.activeElement !== ref.current) {
    setDraft(value);
  }

  const handleBlur = () => {
    if (draft !== value) onCommit(draft);
  };

  const handleTranslate = async () => {
    if (!translateInput || translating) return;
    setTranslating(true);
    try {
      const { translation } = await translateI18nText({
        text: translateInput.sourceText,
        fromLocale: translateInput.fromLocale,
        toLocale: translateInput.toLocale,
        key: translateInput.key,
      });
      setDraft(translation);
      onCommit(translation);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Translate failed';
      onTranslateError(msg);
    } finally {
      setTranslating(false);
    }
  };

  const baseClass =
    'w-full resize-none rounded border bg-white px-1.5 py-1 pr-6 font-mono text-[11.5px] text-zinc-800 outline-none transition focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 dark:bg-zinc-950 dark:text-zinc-200';
  const stateClass = missing
    ? 'border-amber-300 placeholder:text-amber-600 dark:border-amber-700/60 dark:placeholder:text-amber-400'
    : 'border-zinc-200 dark:border-zinc-800';

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        placeholder={missing ? 'missing' : ''}
        aria-label={ariaLabel}
        rows={1}
        className={`${baseClass} ${stateClass}`}
        style={{ minHeight: '1.6rem' }}
        onFocus={(e) => {
          e.currentTarget.rows = Math.max(3, Math.min(6, draft.split('\n').length + 1));
        }}
        onInput={(e) => {
          const ta = e.currentTarget;
          ta.rows = Math.max(1, Math.min(6, ta.value.split('\n').length));
        }}
      />
      {missing && translateInput ? (
        <button
          type="button"
          onClick={handleTranslate}
          disabled={translating}
          aria-label={`Translate to ${translateInput.toLocale} with AI`}
          title="Translate with AI"
          className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded text-amber-600 transition hover:bg-amber-100 hover:text-amber-800 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-900/40 dark:hover:text-amber-200"
        >
          {translating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
        </button>
      ) : null}
    </div>
  );
}
