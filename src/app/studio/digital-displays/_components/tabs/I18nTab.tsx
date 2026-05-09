'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

/**
 * `<I18nTab>` — DSS8. Editor del bag i18n del cliente signage.
 *
 * Locale selector + tabla de keys/values editables + save → PUT a la API
 * que persiste al KV. El runtime ya consulta KV con fallback fs (DSS8 wired
 * en `loadSignageI18n`), así que cambios en este editor reflejan al
 * próximo render del runtime.
 */
export interface I18nTabProps {
  clientSlug: string;
  defaultLocale: string;
}

export function I18nTab({ clientSlug, defaultLocale }: I18nTabProps) {
  const [locale, setLocale] = useState<Locale>(
    LOCALES.includes(defaultLocale as Locale) ? (defaultLocale as Locale) : 'en',
  );
  const [bag, setBag] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [enBag, setEnBag] = useState<Record<string, string>>({});
  const [translatingKey, setTranslatingKey] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  // Probe AI translate availability una vez al montar.
  useEffect(() => {
    fetch('/api/studio/i18n/translate', { method: 'GET' })
      .then((r) => r.json())
      .then((j: { available?: boolean }) => setAiAvailable(!!j.available))
      .catch(() => setAiAvailable(false));
  }, []);

  // Carga el bag EN en paralelo (canónico para AI translate).
  useEffect(() => {
    if (locale === 'en') return; // ya lo cargamos como `bag`
    fetch(`/api/studio/signage/clients/${encodeURIComponent(clientSlug)}/i18n?locale=en`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : { bag: {} }))
      .then((j: { bag?: Record<string, string> }) => setEnBag(j.bag ?? {}))
      .catch(() => setEnBag({}));
  }, [clientSlug, locale]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(
        `/api/studio/signage/clients/${encodeURIComponent(clientSlug)}/i18n?locale=${locale}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { bag?: Record<string, string> };
      setBag(json.bag ?? {});
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [clientSlug, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  function setKey(key: string, value: string) {
    setBag((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSuccess(false);
  }

  async function translateOne(key: string) {
    const sourceText = enBag[key];
    if (!sourceText || locale === 'en') return;
    setTranslatingKey(key);
    setError(null);
    try {
      const res = await fetch('/api/studio/i18n/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          fromLocale: 'en',
          toLocale: locale,
          key,
          context: 'Digital signage display string',
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { translation?: string };
      if (json.translation) setKey(key, json.translation);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTranslatingKey(null);
    }
  }

  const missingKeys =
    locale === 'en' ? [] : Object.keys(enBag).filter((k) => !bag[k] || bag[k].trim() === '');

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(
        `/api/studio/signage/clients/${encodeURIComponent(clientSlug)}/i18n`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale, bag }),
        },
      );
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }
      setSuccess(true);
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Para non-en, unimos las keys del bag actual + las del bag EN para que
  // las missing también aparezcan editables (con un input vacío + botón ✨).
  const allKeySet = new Set<string>();
  for (const k of Object.keys(bag)) allKeySet.add(k);
  if (locale !== 'en') for (const k of Object.keys(enBag)) allKeySet.add(k);
  const keys = Array.from(allKeySet).sort();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            Translations
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            KV overrides al bag base del fs. Cambios reflejan al próximo render del runtime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11.5px] text-zinc-500">
            Locale
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} /> : null}
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[11.5px] text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      ) : null}
      {success && !dirty ? (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Saved · próximo render del runtime usa estos strings.
        </div>
      ) : null}

      {loading ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-[12px] italic text-zinc-400 dark:border-zinc-800">
          Loading translations…
        </p>
      ) : keys.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-[12px] italic text-zinc-400 dark:border-zinc-800">
          No keys yet for this locale.
        </p>
      ) : (
        <>
          {locale !== 'en' && missingKeys.length > 0 && aiAvailable ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <span>
                {missingKeys.length} key{missingKeys.length === 1 ? '' : 's'} without translation
              </span>
              <button
                type="button"
                disabled={translatingKey !== null}
                onClick={async () => {
                  for (const k of missingKeys) {
                    await translateOne(k);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-2.5 py-1 text-[11.5px] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                {translatingKey ? 'Translating…' : 'Translate all missing'}
              </button>
            </div>
          ) : null}
          <ul className="flex flex-col gap-1.5">
            {keys.map((key) => {
              const empty = !bag[key] || bag[key].trim() === '';
              const canTranslate = locale !== 'en' && empty && enBag[key] && aiAvailable;
              const isTranslating = translatingKey === key;
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <code className="flex-shrink-0 font-mono text-[11px] text-zinc-500">{key}</code>
                  <input
                    type="text"
                    value={bag[key] ?? ''}
                    onChange={(e) => setKey(key, e.target.value)}
                    placeholder={locale !== 'en' ? enBag[key] : ''}
                    className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zinc-800 placeholder:italic placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                  />
                  {canTranslate ? (
                    <button
                      type="button"
                      onClick={() => void translateOne(key)}
                      disabled={isTranslating}
                      title={`Translate from English with AI`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-sky-500/10 text-sky-700 transition hover:bg-sky-500/20 disabled:opacity-50 dark:text-sky-300"
                    >
                      {isTranslating ? (
                        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
                      ) : (
                        <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                      )}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
