'use client';

import { Plus, Search, Star } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { LOCALE_LABELS } from '@/lib/i18n';
import {
  LOCALES,
  type I18nBundle,
  type Locale,
  type LocaleStrings,
} from '@/lib/studio/schema';

interface I18nEditorProps {
  value: I18nBundle;
  onChange: (next: I18nBundle) => void;
}

const SECTION_FALLBACK = 'misc';

export function I18nEditor({ value, onChange }: I18nEditorProps) {
  const [section, setSection] = useState<string>('all');
  const [search, setSearch] = useState('');

  const allKeys = useMemo(() => {
    const set = new Set<string>();
    for (const locale of LOCALES) {
      Object.keys(value[locale]).forEach((k) => set.add(k));
    }
    return Array.from(set).sort();
  }, [value]);

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
    return allKeys.filter((key) => {
      if (section !== 'all') {
        const prefix = key.split('_')[0] || SECTION_FALLBACK;
        if (prefix !== section) return false;
      }
      if (!q) return true;
      if (key.toLowerCase().includes(q)) return true;
      return LOCALES.some((loc) => (value[loc][key] ?? '').toLowerCase().includes(q));
    });
  }, [allKeys, section, search, value]);

  const missingByLocale = useMemo(() => {
    const result: Record<Locale, number> = {
      en: 0,
      es: 0,
      fr: 0,
      de: 0,
      pt: 0,
      ja: 0,
    };
    for (const key of allKeys) {
      const enValue = value.en[key];
      if (!enValue) continue; // si EN tampoco la tiene, no es "missing" técnicamente
      for (const loc of LOCALES) {
        if (loc === 'en') continue;
        if (!value[loc][key] || value[loc][key].trim() === '') {
          result[loc]++;
        }
      }
    }
    return result;
  }, [allKeys, value]);

  const updateCell = (locale: Locale, key: string, next: string) => {
    const current = value[locale][key] ?? '';
    if (current === next) return;
    const nextLocale: LocaleStrings = { ...value[locale] };
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
      en: { ...value.en, [key]: '' },
    });
    setSection('all');
    setSearch(key);
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
          {sections.map(([prefix, count]) => (
            <option key={prefix} value={prefix}>
              {prefix} ({count})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddKey}
          className="flex items-center gap-1 rounded-md bg-sky-500/15 px-2.5 py-1.5 text-[11.5px] font-medium text-sky-700 transition hover:bg-sky-500/25 dark:text-sky-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add key
        </button>
      </div>

      <MissingSummary missing={missingByLocale} />

      <div className="overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full table-fixed text-left text-[12px]">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            <tr>
              <th className="w-[22%] px-2 py-2 font-medium">Key</th>
              {LOCALES.map((loc) => (
                <th key={loc} className="w-[13%] px-2 py-2 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="font-mono text-[10.5px] uppercase">{loc}</span>
                    <span className="text-[10px] text-zinc-500">
                      {LOCALE_LABELS[loc]}
                    </span>
                    {loc === 'en' ? (
                      <Star
                        className="ml-0.5 h-3 w-3 fill-amber-400 text-amber-400"
                        aria-label="canonical"
                      />
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visibleKeys.length === 0 ? (
              <tr>
                <td
                  colSpan={LOCALES.length + 1}
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
                  onChangeCell={updateCell}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MissingSummary({ missing }: { missing: Record<Locale, number> }) {
  const total = LOCALES.reduce((acc, loc) => acc + (loc === 'en' ? 0 : missing[loc]), 0);
  if (total === 0) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[11.5px] text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
        ✓ All locales fully translated against EN.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-[11.5px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
      <span className="font-semibold">Missing translations:</span>
      {LOCALES.filter((l) => l !== 'en').map((loc) => (
        <span
          key={loc}
          className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
            missing[loc] > 0
              ? 'bg-amber-200/70 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100'
              : 'bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100'
          }`}
        >
          {loc.toUpperCase()} {missing[loc]}
        </span>
      ))}
    </div>
  );
}

function I18nRow({
  k,
  bundle,
  onChangeCell,
}: {
  k: string;
  bundle: I18nBundle;
  onChangeCell: (locale: Locale, key: string, next: string) => void;
}) {
  return (
    <tr className="align-top">
      <td className="px-2 py-1.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
        <span className="break-all">{k}</span>
      </td>
      {LOCALES.map((loc) => (
        <td key={loc} className="px-1.5 py-1.5">
          <I18nCell
            value={bundle[loc][k] ?? ''}
            onCommit={(next) => onChangeCell(loc, k, next)}
            ariaLabel={`${k} in ${loc}`}
            missing={
              loc !== 'en' &&
              !!bundle.en[k] &&
              (!bundle[loc][k] || bundle[loc][k].trim() === '')
            }
          />
        </td>
      ))}
    </tr>
  );
}

function I18nCell({
  value,
  onCommit,
  ariaLabel,
  missing,
}: {
  value: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  missing: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  // sincroniza draft cuando el valor externo cambia (e.g. fresh load)
  if (value !== draft && document.activeElement !== ref.current) {
    // sólo sincroniza si el textarea no tiene foco — evita pisar typing
    setDraft(value);
  }

  const handleBlur = () => {
    if (draft !== value) onCommit(draft);
  };

  const baseClass =
    'w-full resize-none rounded border bg-white px-1.5 py-1 font-mono text-[11.5px] text-zinc-800 outline-none transition focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 dark:bg-zinc-950 dark:text-zinc-200';
  const stateClass = missing
    ? 'border-amber-300 placeholder:text-amber-600 dark:border-amber-700/60 dark:placeholder:text-amber-400'
    : 'border-zinc-200 dark:border-zinc-800';

  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      placeholder={missing ? 'missing' : ''}
      aria-label={ariaLabel}
      rows={1}
      className={`${baseClass} ${stateClass} focus:rows-4`}
      style={{ minHeight: '1.6rem' }}
      onFocus={(e) => {
        // expand on focus
        e.currentTarget.rows = Math.max(3, Math.min(6, draft.split('\n').length + 1));
      }}
      onInput={(e) => {
        // auto-grow mientras escribe
        const ta = e.currentTarget;
        ta.rows = Math.max(1, Math.min(6, ta.value.split('\n').length));
      }}
    />
  );
}
