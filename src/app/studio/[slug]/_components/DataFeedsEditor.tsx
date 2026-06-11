'use client';

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Database,
  Loader2,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  CategoryMapping,
  CleanFlag,
  ClientContent,
  ContentItemStatus,
  EventContentItem,
  FeedConnection,
  FeedProvider,
  ListingContentItem,
} from '@/lib/studio/client-content';
import {
  FEED_PROVIDERS,
  isItemVisible,
  resolveEvent,
  resolveListing,
} from '@/lib/studio/client-content';

import { MediaField } from '../../_components/MediaField';
import { TabStrip, type TabStripItem } from '../../_components/TabStrip';
import {
  ConfirmDialog,
  Field,
  Select,
  TextInput,
  Textarea,
  ToggleSwitch,
} from '../../_components/ui';

/**
 * `<DataFeedsEditor>` — editor del documento de **contenido a nivel cliente**
 * (`ClientContent`): conexiones a feeds externos, mapeo de categorías y revisión
 * de los items ingeridos. Vive como una tab más dentro del `BrandingForm`.
 *
 * Carga el `ClientContent` vía `GET /content`, lo mantiene en estado local y
 * autosalva con debounce (~1s) vía `PATCH /content` con optimistic concurrency
 * (`ifVersion`). Ante 409 recarga con GET y reintenta una vez. Sigue el mismo
 * patrón de autosave de `ClientView` para el branding.
 *
 * Tres sub-tabs:
 *  - Connections: cards por feed (provider + credenciales + Test + Sync).
 *  - Category mapping: tabla `feedCategory → moduleKey + label + contentType`.
 *  - Review: lista de items con badges, filtros, búsqueda y edición inline.
 */
export interface DataFeedsEditorProps {
  slug: string;
}

type SaveState = 'idle' | 'loading' | 'saving' | 'saved' | 'error';
type SubTab = 'connections' | 'mapping' | 'review';

const SUB_TABS: ReadonlyArray<TabStripItem<SubTab>> = [
  { key: 'connections', label: 'Connections', title: 'Feed providers and credentials' },
  { key: 'mapping', label: 'Category mapping', title: 'Map raw feed categories to modules' },
  { key: 'review', label: 'Review', title: 'Review, edit and hide ingested items' },
];

/** Etiqueta legible por provider para el selector y los headers de las cards. */
const PROVIDER_LABEL: Record<FeedProvider, string> = {
  simpleview: 'Simpleview',
  tempest: 'Tempest',
  crowdriff: 'CrowdRiff',
  wordpress: 'WordPress',
};

/** moduleKeys canónicos sugeridos para el mapeo de categorías. */
const CANONICAL_MODULES = ['restaurants', 'things-to-do', 'stay', 'events'] as const;

export function DataFeedsEditor({ slug }: DataFeedsEditorProps) {
  const [subTab, setSubTab] = useState<SubTab>('connections');
  const [content, setContent] = useState<ClientContent | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const [error, setError] = useState<string | null>(null);

  // Ref con el último content persistido en KV (para reintento tras 409).
  const versionRef = useRef<number>(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  // Contador incremental para IDs de items manuales y feeds (sin Date.now).
  const counterRef = useRef(0);

  // Carga inicial del contenido.
  const load = useCallback(async () => {
    setSaveState('loading');
    setError(null);
    try {
      const res = await fetch(`/api/studio/clients/${slug}/content`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`load failed: ${res.status}`);
      const body = (await res.json()) as { content: ClientContent };
      versionRef.current = body.content.currentVersion;
      setContent(body.content);
      setSaveState('idle');
    } catch (e) {
      setSaveState('error');
      setError(e instanceof Error ? e.message : 'Load failed');
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  // Persiste con optimistic concurrency. Ante 409 recarga e intenta una vez más
  // re-aplicando los cambios locales sobre la versión fresca del servidor.
  const persist = useCallback(
    async (next: ClientContent, isRetry = false) => {
      setSaveState('saving');
      setError(null);
      try {
        const res = await fetch(`/api/studio/clients/${slug}/content`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ content: next, ifVersion: versionRef.current }),
        });
        if (res.status === 409) {
          // Versión desfasada: tomamos la versión actual del servidor y, si es
          // el primer intento, reintentamos una vez con el nuevo ifVersion.
          const body = (await res.json().catch(() => ({}))) as { currentVersion?: number };
          if (!isRetry && typeof body.currentVersion === 'number') {
            versionRef.current = body.currentVersion;
            await persist({ ...next, currentVersion: body.currentVersion }, true);
            return;
          }
          throw new Error('Version conflict — reload the page.');
        }
        if (res.status === 413) {
          throw new Error('Content too large to save.');
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `save failed: ${res.status}`);
        }
        const body = (await res.json()) as { ok: boolean; version: number };
        versionRef.current = body.version;
        dirtyRef.current = false;
        setSaveState('saved');
      } catch (e) {
        setSaveState('error');
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    },
    [slug],
  );

  // Aplica un cambio local + programa el autosave debounced.
  const mutate = useCallback(
    (updater: (prev: ClientContent) => ClientContent) => {
      setContent((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        dirtyRef.current = true;
        setSaveState('idle');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          if (dirtyRef.current) void persist(next);
        }, 1000);
        return next;
      });
    },
    [persist],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Genera un id único determinista por sesión: contador incremental con prefijo,
  // o crypto.randomUUID si está disponible en el navegador.
  const nextId = useCallback((prefix: string) => {
    counterRef.current += 1;
    const uuid =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${counterRef.current}`;
    return `${prefix}:${uuid}`;
  }, []);

  if (saveState === 'loading' || !content) {
    return (
      <div className="flex h-full flex-col">
        <Header subTab={subTab} onSubTab={setSubTab} saveState={saveState} error={error} />
        <div className="flex flex-1 items-center justify-center text-zinc-500">
          {saveState === 'error' ? (
            <div className="flex flex-col items-center gap-2 text-[12.5px]">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <span>{error ?? 'Failed to load content.'}</span>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Retry
              </button>
            </div>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header subTab={subTab} onSubTab={setSubTab} saveState={saveState} error={error} />
      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        {subTab === 'connections' ? (
          <ConnectionsSection
            slug={slug}
            content={content}
            mutate={mutate}
            nextId={nextId}
            reload={load}
          />
        ) : null}
        {subTab === 'mapping' ? <MappingSection content={content} mutate={mutate} /> : null}
        {subTab === 'review' ? (
          <ReviewSection slug={slug} content={content} mutate={mutate} nextId={nextId} />
        ) : null}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Header — sub-tabs + estado de save                                       */
/* ──────────────────────────────────────────────────────────────────────── */

function Header({
  subTab,
  onSubTab,
  saveState,
  error,
}: {
  subTab: SubTab;
  onSubTab: (t: SubTab) => void;
  saveState: SaveState;
  error: string | null;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800">
      <TabStrip<SubTab>
        items={SUB_TABS}
        active={subTab}
        onChange={onSubTab}
        idBase="data-feeds-subtabs"
        ariaLabel="Data feeds sections"
        variant="underline"
      />
      <SavePill state={saveState} error={error} />
    </div>
  );
}

function SavePill({ state, error }: { state: SaveState; error: string | null }) {
  const label = (() => {
    if (state === 'saving')
      return {
        text: 'Saving…',
        dot: 'bg-amber-400 animate-pulse',
        color: 'text-amber-600 dark:text-amber-300',
      };
    if (state === 'error')
      return {
        text: error ?? 'Save failed',
        dot: 'bg-red-500',
        color: 'text-red-600 dark:text-red-400',
      };
    if (state === 'saved')
      return {
        text: 'Saved',
        dot: 'bg-emerald-500',
        color: 'text-emerald-600 dark:text-emerald-400',
      };
    if (state === 'loading')
      return { text: 'Loading…', dot: 'bg-zinc-400 animate-pulse', color: 'text-zinc-500' };
    return { text: 'Up to date', dot: 'bg-zinc-400 dark:bg-zinc-600', color: 'text-zinc-500' };
  })();
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 pb-2 text-[11.5px] ${label.color}`}
      role="status"
      aria-live="polite"
      title={label.text}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${label.dot}`} aria-hidden />
      <span className="hidden sm:inline">{label.text}</span>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  A) Connections                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

function ConnectionsSection({
  slug,
  content,
  mutate,
  nextId,
  reload,
}: {
  slug: string;
  content: ClientContent;
  mutate: (updater: (prev: ClientContent) => ClientContent) => void;
  nextId: (prefix: string) => string;
  reload: () => Promise<void>;
}) {
  const addConnection = () => {
    const id = nextId('feed');
    mutate((prev) => ({
      ...prev,
      feeds: [
        ...prev.feeds,
        {
          id,
          provider: 'wordpress',
          label: '',
          config: {},
          enabled: true,
          lastSyncStatus: 'never',
        } satisfies FeedConnection,
      ],
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-zinc-500">
          Connect external feeds. Test the credentials, then sync to pull listings and events.
        </p>
        <button
          type="button"
          onClick={addConnection}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <Plus className="h-3.5 w-3.5" />
          Add connection
        </button>
      </div>

      {content.feeds.length === 0 ? (
        <EmptyState
          icon={<Database className="h-5 w-5" />}
          title="No connections yet"
          hint="Add a connection to start ingesting content from a provider."
        />
      ) : (
        content.feeds.map((feed) => (
          <ConnectionCard key={feed.id} slug={slug} feed={feed} mutate={mutate} reload={reload} />
        ))
      )}
    </div>
  );
}

interface FeedTestResult {
  ok: boolean;
  message: string;
  sampleCount?: number;
}

interface SyncDiffSummary {
  added: number;
  updated: number;
  removed: number;
  total: number;
}

function ConnectionCard({
  slug,
  feed,
  mutate,
  reload,
}: {
  slug: string;
  feed: FeedConnection;
  mutate: (updater: (prev: ClientContent) => ClientContent) => void;
  reload: () => Promise<void>;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<FeedTestResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncDiffSummary | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Actualiza la conexión en el documento.
  const update = (patch: Partial<FeedConnection>) =>
    mutate((prev) => ({
      ...prev,
      feeds: prev.feeds.map((f) => (f.id === feed.id ? { ...f, ...patch } : f)),
    }));
  const updateConfig = (key: string, value: string) =>
    update({ config: { ...feed.config, [key]: value } });

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/studio/clients/${slug}/content/test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: feed.provider, config: feed.config }),
      });
      const body = (await res.json()) as { result?: FeedTestResult; error?: string };
      if (!res.ok || !body.result) {
        setTestResult({ ok: false, message: body.error ?? `Test failed (${res.status})` });
      } else {
        setTestResult(body.result);
      }
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await fetch(`/api/studio/clients/${slug}/content/sync`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ feedId: feed.id }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        diff?: { summary: SyncDiffSummary };
        error?: string;
        message?: string;
      };
      if (!res.ok || !body.ok) {
        setSyncError(body.message ?? body.error ?? `Sync failed (${res.status})`);
        // Aun en error el servidor pudo persistir el estado de la conexión.
        await reload();
        return;
      }
      setSyncResult(body.diff?.summary ?? { added: 0, updated: 0, removed: 0, total: 0 });
      // Tras sync el documento cambió server-side: recargamos para reflejarlo.
      await reload();
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
      <header className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          <Database className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[13px] font-semibold text-zinc-900 dark:text-white">
            {feed.label.trim() || PROVIDER_LABEL[feed.provider]}
          </h3>
          <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
            <LastSyncLine feed={feed} />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ToggleSwitch
            enabled={feed.enabled}
            onChange={() => update({ enabled: !feed.enabled })}
            label={feed.label.trim() || PROVIDER_LABEL[feed.provider]}
            title={feed.enabled ? 'Enabled — included in sync' : 'Disabled'}
          />
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete connection"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Provider">
          <Select
            value={feed.provider}
            onChange={(e) => update({ provider: e.target.value as FeedProvider })}
          >
            {FEED_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Label" helpText="Friendly name shown in lists.">
          <TextInput
            value={feed.label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder={PROVIDER_LABEL[feed.provider]}
          />
        </Field>
      </div>

      <CredentialFields provider={feed.provider} config={feed.config} onChange={updateConfig} />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        >
          {testing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlayCircle className="h-3.5 w-3.5" />
          )}
          {testing ? 'Testing…' : 'Test'}
        </button>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-md border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-[11.5px] font-medium text-sky-800 transition hover:border-sky-400 hover:bg-sky-100 disabled:opacity-40 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:border-sky-500/60 dark:hover:bg-sky-500/20"
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {syncing ? 'Syncing…' : 'Sync'}
        </button>

        {testResult ? (
          <ResultBadge ok={testResult.ok}>
            {testResult.message}
            {testResult.ok && typeof testResult.sampleCount === 'number'
              ? ` · ${testResult.sampleCount} sample${testResult.sampleCount === 1 ? '' : 's'}`
              : ''}
          </ResultBadge>
        ) : null}
        {syncResult ? (
          <ResultBadge ok>
            {`+${syncResult.added} added · ${syncResult.updated} updated · ${syncResult.removed} removed`}
          </ResultBadge>
        ) : null}
        {syncError ? <ResultBadge ok={false}>{syncError}</ResultBadge> : null}
      </div>

      {confirmDelete ? (
        <ConfirmDialog
          title="Delete this connection?"
          description="The connection and its credentials are removed. Already-ingested items stay until you remove them in Review."
          confirmLabel="Delete connection"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            mutate((prev) => ({ ...prev, feeds: prev.feeds.filter((f) => f.id !== feed.id) }));
          }}
        />
      ) : null}
    </section>
  );
}

function LastSyncLine({ feed }: { feed: FeedConnection }) {
  if (feed.lastSyncStatus === 'never' || !feed.lastSyncedAt) {
    return <>Never synced — {PROVIDER_LABEL[feed.provider]}</>;
  }
  const when = formatRelative(feed.lastSyncedAt);
  if (feed.lastSyncStatus === 'error') {
    return (
      <span className="text-rose-600 dark:text-rose-400">
        Last sync failed {when}
        {feed.lastSyncError ? ` — ${feed.lastSyncError.slice(0, 80)}` : ''}
      </span>
    );
  }
  const s = feed.lastSyncSummary;
  return (
    <>
      <span className="text-emerald-600 dark:text-emerald-400">Synced {when}</span>
      {s ? ` · +${s.added} / ${s.updated} upd / ${s.removed} rem` : ''}
    </>
  );
}

/**
 * Inputs de credenciales según provider. WordPress usa una API REST (baseUrl +
 * post types); Simpleview/Tempest exponen endpoints REST con apiKey; CrowdRiff
 * solo pide apiKey.
 */
function CredentialFields({
  provider,
  config,
  onChange,
}: {
  provider: FeedProvider;
  config: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (provider === 'wordpress') {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Base URL" helpText="Site root, e.g. https://example.com">
          <TextInput
            value={config.baseUrl ?? ''}
            onChange={(e) => onChange('baseUrl', e.target.value)}
            placeholder="https://example.com"
            className="font-mono"
          />
        </Field>
        <Field label="Post type" helpText="REST post type for listings, e.g. 'listing'.">
          <TextInput
            value={config.postType ?? ''}
            onChange={(e) => onChange('postType', e.target.value)}
            placeholder="listing"
            className="font-mono"
          />
        </Field>
        <Field label="Events post type" helpText="REST post type for events.">
          <TextInput
            value={config.eventsPostType ?? ''}
            onChange={(e) => onChange('eventsPostType', e.target.value)}
            placeholder="event"
            className="font-mono"
          />
        </Field>
      </div>
    );
  }
  if (provider === 'simpleview' || provider === 'tempest') {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Endpoint" helpText="Listings REST endpoint URL.">
          <TextInput
            value={config.endpoint ?? ''}
            onChange={(e) => onChange('endpoint', e.target.value)}
            placeholder="https://api.provider.com/listings"
            className="font-mono"
          />
        </Field>
        <Field label="Events endpoint" helpText="Events REST endpoint URL.">
          <TextInput
            value={config.eventsEndpoint ?? ''}
            onChange={(e) => onChange('eventsEndpoint', e.target.value)}
            placeholder="https://api.provider.com/events"
            className="font-mono"
          />
        </Field>
        <Field label="API key">
          <SecretInput value={config.apiKey ?? ''} onChange={(v) => onChange('apiKey', v)} />
        </Field>
      </div>
    );
  }
  // crowdriff
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Field label="API key" helpText="Provided by CrowdRiff.">
        <SecretInput value={config.apiKey ?? ''} onChange={(v) => onChange('apiKey', v)} />
      </Field>
    </div>
  );
}

/** Input enmascarado para credenciales (reveal toggle), patrón de IntegrationsEditor. */
function SecretInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="relative">
      <input
        type={reveal ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        spellCheck={false}
        autoComplete="off"
        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 pr-14 font-mono text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <button
        type="button"
        onClick={() => setReveal((v) => !v)}
        className="absolute right-1.5 top-1.5 rounded px-1.5 py-1 text-[10.5px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        {reveal ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  B) Category mapping                                                      */
/* ──────────────────────────────────────────────────────────────────────── */

function MappingSection({
  content,
  mutate,
}: {
  content: ClientContent;
  mutate: (updater: (prev: ClientContent) => ClientContent) => void;
}) {
  // Categorías crudas detectadas en los items, con su feedId y contentType de
  // origen, para autocompletar la tabla de mapeos.
  const detected = useMemo(() => detectCategories(content), [content]);

  // Index de mapeos existentes por (feedId + feedCategory) para lookup rápido.
  const mapIndex = useMemo(() => {
    const m = new Map<string, CategoryMapping>();
    for (const cm of content.categoryMap) m.set(`${cm.feedId} ${cm.feedCategory}`, cm);
    return m;
  }, [content.categoryMap]);

  const unmappedCount = detected.filter(
    (d) => !mapIndex.has(`${d.feedId} ${d.feedCategory}`),
  ).length;

  // Upsert de un mapeo (feedId + feedCategory es la clave natural).
  const setMapping = (
    feedId: string,
    feedCategory: string,
    patch: Partial<Pick<CategoryMapping, 'moduleKey' | 'label' | 'contentType'>>,
    contentType: 'listing' | 'event',
  ) => {
    mutate((prev) => {
      const exists = prev.categoryMap.find(
        (cm) => cm.feedId === feedId && cm.feedCategory === feedCategory,
      );
      if (exists) {
        return {
          ...prev,
          categoryMap: prev.categoryMap.map((cm) =>
            cm.feedId === feedId && cm.feedCategory === feedCategory ? { ...cm, ...patch } : cm,
          ),
        };
      }
      const created: CategoryMapping = {
        feedId,
        feedCategory,
        moduleKey: patch.moduleKey ?? '',
        label: patch.label ?? '',
        contentType: patch.contentType ?? contentType,
      };
      return { ...prev, categoryMap: [...prev.categoryMap, created] };
    });
  };

  if (detected.length === 0) {
    return (
      <EmptyState
        icon={<Database className="h-5 w-5" />}
        title="No categories detected"
        hint="Sync a connection first — the raw categories from the feed appear here for mapping."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-zinc-500">
        Map each raw feed category to a module. Several categories can point to the same module.
      </p>

      {unmappedCount > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-[11.5px] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {unmappedCount} categor{unmappedCount === 1 ? 'y' : 'ies'} still unmapped.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
              <th className="px-3 py-2">Feed category</th>
              <th className="px-3 py-2">Module key</th>
              <th className="px-3 py-2">Label (visible name)</th>
              <th className="px-3 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {detected.map((d) => {
              const existing = mapIndex.get(`${d.feedId} ${d.feedCategory}`);
              const moduleKey = existing?.moduleKey ?? '';
              const label = existing?.label ?? '';
              const ctype = existing?.contentType ?? d.contentType;
              const canonicalHint = CANONICAL_MODULES.includes(
                moduleKey as (typeof CANONICAL_MODULES)[number],
              )
                ? moduleKey
                : 'restaurants';
              return (
                <tr
                  key={`${d.feedId} ${d.feedCategory}`}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                >
                  <td className="px-3 py-2 align-top">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {d.feedCategory || '(uncategorized)'}
                    </span>
                    <span className="mt-0.5 block text-[10.5px] text-zinc-400">
                      {d.feedLabel} · {d.count} item{d.count === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <ModuleKeyInput
                      value={moduleKey}
                      onChange={(v) =>
                        setMapping(d.feedId, d.feedCategory, { moduleKey: v }, d.contentType)
                      }
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <TextInput
                      value={label}
                      onChange={(e) =>
                        setMapping(
                          d.feedId,
                          d.feedCategory,
                          { label: e.target.value },
                          d.contentType,
                        )
                      }
                      placeholder={canonicalHint}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Select
                      value={ctype}
                      onChange={(e) =>
                        setMapping(
                          d.feedId,
                          d.feedCategory,
                          { contentType: e.target.value as 'listing' | 'event' },
                          d.contentType,
                        )
                      }
                    >
                      <option value="listing">Listing</option>
                      <option value="event">Event</option>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Input de moduleKey con datalist de sugerencias canónicas. Normaliza a
 * kebab-case (lowercase, dígitos y guiones) coincidiendo con el regex del
 * schema, así un módulo custom escrito a mano sigue siendo válido.
 */
function ModuleKeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const listId = useMemo(
    () => `module-key-suggestions-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );
  return (
    <div className="relative">
      <TextInput
        value={value}
        onChange={(e) => onChange(toKebab(e.target.value))}
        placeholder="restaurants"
        className="font-mono"
        list={listId}
        invalid={value.length > 0 && !/^[a-z0-9][a-z0-9-]*$/.test(value)}
      />
      <datalist id={listId}>
        {CANONICAL_MODULES.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
}

interface DetectedCategory {
  feedId: string;
  feedLabel: string;
  feedCategory: string;
  contentType: 'listing' | 'event';
  count: number;
}

/** Deriva las categorías crudas distintas (por feed) presentes en los items. */
function detectCategories(content: ClientContent): DetectedCategory[] {
  const feedLabelById = new Map<string, string>();
  for (const f of content.feeds)
    feedLabelById.set(f.id, f.label.trim() || PROVIDER_LABEL[f.provider]);

  const acc = new Map<string, DetectedCategory>();
  const visit = (source: string, feedCategory: string, contentType: 'listing' | 'event') => {
    if (source === 'manual') return; // los manuales no vienen de un feed
    const key = `${source} ${feedCategory}`;
    const prev = acc.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      acc.set(key, {
        feedId: source,
        feedLabel: feedLabelById.get(source) ?? source,
        feedCategory,
        contentType,
        count: 1,
      });
    }
  };
  for (const it of content.listings) visit(it.source, it.feedCategory, 'listing');
  for (const it of content.events) visit(it.source, it.feedCategory, 'event');

  return [...acc.values()].sort(
    (a, b) =>
      a.feedLabel.localeCompare(b.feedLabel) || a.feedCategory.localeCompare(b.feedCategory),
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  C) Review                                                                */
/* ──────────────────────────────────────────────────────────────────────── */

type ReviewFilter = 'all' | 'flagged' | 'new' | 'removed';

type AnyItem = ListingContentItem | EventContentItem;

const STATUS_LABEL: Record<ContentItemStatus, string> = {
  active: 'Active',
  flagged: 'Flagged',
  hidden: 'Hidden',
  'removed-upstream': 'Removed upstream',
};

function ReviewSection({
  slug,
  content,
  mutate,
  nextId,
}: {
  slug: string;
  content: ClientContent;
  mutate: (updater: (prev: ClientContent) => ClientContent) => void;
  nextId: (prefix: string) => string;
}) {
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  // Une listings + events en una sola lista para mostrar.
  const allItems: AnyItem[] = useMemo(
    () => [...content.listings, ...content.events],
    [content.listings, content.events],
  );

  // moduleKeys disponibles (resueltos vía categoryMap) para el filtro por módulo.
  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const cm of content.categoryMap) if (cm.moduleKey) set.add(cm.moduleKey);
    return [...set].sort();
  }, [content.categoryMap]);

  const moduleKeyOf = useCallback(
    (item: AnyItem): string => {
      const cm = content.categoryMap.find(
        (c) => c.feedId === item.source && c.feedCategory === item.feedCategory,
      );
      return cm?.moduleKey ?? '';
    },
    [content.categoryMap],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (filter === 'flagged' && !(item.status === 'flagged' || item.flags.length > 0))
        return false;
      if (filter === 'new' && !isNewSinceLastSync(item, content.lastSyncAt)) return false;
      if (filter === 'removed' && item.status !== 'removed-upstream') return false;
      if (moduleFilter !== 'all' && moduleKeyOf(item) !== moduleFilter) return false;
      if (q) {
        const title = titleOf(item).toLowerCase();
        if (!title.includes(q)) return false;
      }
      return true;
    });
  }, [allItems, filter, moduleFilter, query, content.lastSyncAt, moduleKeyOf]);

  const addManual = () => {
    const id = nextId('manual');
    mutate((prev) => ({
      ...prev,
      listings: [
        ...prev.listings,
        {
          id,
          type: 'listing',
          source: 'manual',
          feedCategory: '',
          flags: [],
          status: 'active',
          feedData: {},
          override: { title: 'New item' },
        } satisfies ListingContentItem,
      ],
    }));
  };

  const FILTERS: ReadonlyArray<{ key: ReviewFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'flagged', label: 'Flagged' },
    { key: 'new', label: 'New since last sync' },
    { key: 'removed', label: 'Removed upstream' },
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar: filtros + búsqueda + añadir manual */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-2.5 py-1 text-[11.5px] font-medium transition ${
                filter === f.key
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {moduleOptions.length > 0 ? (
          <div className="w-40">
            <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="all">All modules</option>
              {moduleOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-7 pr-2 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        </div>
        <button
          type="button"
          onClick={addManual}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <Plus className="h-3.5 w-3.5" />
          Add manual item
        </button>
      </div>

      <p className="text-[11px] text-zinc-500">
        {filtered.length} of {allItems.length} item{allItems.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Database className="h-5 w-5" />}
          title="No items match"
          hint={
            allItems.length === 0
              ? 'Sync a connection or add a manual item.'
              : 'Try another filter.'
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <ReviewItem key={item.id} slug={slug} item={item} mutate={mutate} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewItem({
  slug,
  item,
  mutate,
}: {
  slug: string;
  item: AnyItem;
  mutate: (updater: (prev: ClientContent) => ClientContent) => void;
}) {
  const [open, setOpen] = useState(false);
  const resolved = item.type === 'listing' ? resolveListing(item) : resolveEvent(item);
  const title = titleOf(item);
  const visible = isItemVisible(item);

  // Escribe un campo del override (NUNCA feedData) sobre el item correcto.
  const setOverride = (patch: Record<string, unknown>) =>
    mutate((prev) => {
      const apply = <T extends AnyItem>(arr: T[]): T[] =>
        arr.map((x) =>
          x.id === item.id ? ({ ...x, override: { ...x.override, ...patch } } as T) : x,
        );
      return item.type === 'listing'
        ? { ...prev, listings: apply(prev.listings) }
        : { ...prev, events: apply(prev.events) };
    });

  // Alterna hidden ↔ active.
  const toggleHidden = () =>
    mutate((prev) => {
      const nextStatus: ContentItemStatus = item.status === 'hidden' ? 'active' : 'hidden';
      const apply = <T extends AnyItem>(arr: T[]): T[] =>
        arr.map((x) => (x.id === item.id ? ({ ...x, status: nextStatus } as T) : x));
      return item.type === 'listing'
        ? { ...prev, listings: apply(prev.listings) }
        : { ...prev, events: apply(prev.events) };
    });

  const ov = item.override as Record<string, unknown>;
  const fd = item.feedData as Record<string, unknown>;
  const strVal = (k: string): string =>
    typeof ov[k] === 'string'
      ? (ov[k] as string)
      : typeof fd[k] === 'string'
        ? (fd[k] as string)
        : '';
  const coords = (ov.coords ?? fd.coords) as { lat?: number; lng?: number } | undefined;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded text-zinc-400 transition ${open ? 'rotate-180' : ''}`}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[13px] font-medium ${visible ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 line-through dark:text-zinc-600'}`}
          >
            {title}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1">
            <StatusBadge status={item.status} />
            <span className="text-[10.5px] uppercase tracking-wide text-zinc-400">{item.type}</span>
            {item.flags.map((flag) => (
              <FlagBadge key={flag} flag={flag} />
            ))}
          </span>
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-zinc-100 px-3 py-3 dark:border-zinc-800/60">
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <div>
              {/* Imagen vía MediaField (sube a Blob y escribe el override). */}
              <MediaField
                label="Image"
                hint=""
                aspect="4/3"
                slug={slug}
                value={strVal('image')}
                kind="image"
                hideUrlInput
                onChange={(next) => setOverride({ image: next?.src ?? '' })}
              />
            </div>
            <div className="space-y-2.5">
              <Field label="Title">
                <TextInput
                  value={strVal('title')}
                  onChange={(e) => setOverride({ title: e.target.value })}
                  placeholder={title}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Address">
                  <TextInput
                    value={strVal('address')}
                    onChange={(e) => setOverride({ address: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <TextInput
                    value={strVal('phone')}
                    onChange={(e) => setOverride({ phone: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Latitude">
                  <TextInput
                    value={coords?.lat != null ? String(coords.lat) : ''}
                    onChange={(e) =>
                      setOverride({
                        coords: {
                          lat: parseCoord(e.target.value, -90, 90) ?? coords?.lat ?? 0,
                          lng: coords?.lng ?? 0,
                        },
                      })
                    }
                    placeholder="Latitude (-90 to 90)"
                  />
                </Field>
                <Field label="Longitude">
                  <TextInput
                    value={coords?.lng != null ? String(coords.lng) : ''}
                    onChange={(e) =>
                      setOverride({
                        coords: {
                          lat: coords?.lat ?? 0,
                          lng: parseCoord(e.target.value, -180, 180) ?? coords?.lng ?? 0,
                        },
                      })
                    }
                    placeholder="Longitude (-180 to 180)"
                  />
                </Field>
              </div>
            </div>
          </div>

          <Field label="Description">
            <Textarea
              value={strVal('description')}
              onChange={(e) => setOverride({ description: e.target.value })}
              rows={3}
            />
          </Field>

          <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-800/60">
            <span className="text-[10.5px] text-zinc-400">
              {resolved
                ? 'Resolves to a valid item.'
                : 'Incomplete — missing required fields (e.g. title).'}
            </span>
            <button
              type="button"
              onClick={toggleHidden}
              className={`rounded-md border px-2.5 py-1 text-[11.5px] font-medium transition ${
                item.status === 'hidden'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {item.status === 'hidden' ? 'Restore' : 'Hide'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: ContentItemStatus }) {
  const tone =
    status === 'active'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
      : status === 'flagged'
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
        : status === 'hidden'
          ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function FlagBadge({ flag }: { flag: CleanFlag }) {
  return (
    <span className="rounded bg-amber-100/70 px-1.5 py-0.5 text-[9.5px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
      {flag}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function ResultBadge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      role="status"
      className={`inline-flex items-start gap-1.5 rounded-md border px-2 py-1 text-[11px] ${
        ok
          ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200'
          : 'border-red-200 bg-red-50/70 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200'
      }`}
    >
      {ok ? (
        <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
      )}
      <span>{children}</span>
    </span>
  );
}

function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-zinc-400 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        {icon}
      </span>
      <p className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{title}</p>
      <p className="max-w-[320px] text-[11.5px] text-zinc-500">{hint}</p>
    </div>
  );
}

/** Título resuelto del item (override gana sobre feedData). */
function titleOf(item: AnyItem): string {
  const ov = item.override as { title?: unknown };
  const fd = item.feedData as { title?: unknown };
  if (typeof ov.title === 'string' && ov.title.trim()) return ov.title;
  if (typeof fd.title === 'string' && fd.title.trim()) return fd.title;
  return '(untitled)';
}

/** True si el item se vio por primera vez en/después del último sync. */
function isNewSinceLastSync(item: AnyItem, lastSyncAt?: string): boolean {
  if (!lastSyncAt || !item.firstSeenAt) return false;
  return new Date(item.firstSeenAt).getTime() >= new Date(lastSyncAt).getTime();
}

/** Parsea una coordenada numérica con clamp al rango; null si no es número. */
function parseCoord(raw: string, min: number, max: number): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
}

/** Normaliza a kebab-case (lowercase, dígitos, guiones). */
function toKebab(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '');
}

/** Tiempo relativo compacto ("just now", "5m ago", "3h ago", "2d ago"). */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'recently';
  const sec = Math.round((Date.now() - then) / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}
