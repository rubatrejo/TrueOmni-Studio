'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  GitPullRequest,
  Loader2,
  Monitor,
  Package,
  RotateCcw,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  publishStandalone,
  publishToFilesystem,
  type PublishFileChange,
  type PublishPrInfo,
  type StandaloneExportResult,
} from '../_lib/api-client';
import { recordPublish as recordPublishLocal } from '../_lib/local-version-history';
import { useEscapeClose, useFocusTrap } from '../_lib/use-modal-a11y';

interface PublishModalProps {
  open: boolean;
  slug: string;
  onClose: () => void;
  /** Versión actual (post-incremento al publicar). Si no se conoce, lo
   *  registramos como `version+1` o 1 cuando se desconoce. */
  currentVersion?: number;
  /** Editor que está publicando. Se persiste en el timeline local. */
  editor?: string;
}

type Phase = 'preview' | 'preview-loading' | 'publishing' | 'done' | 'error';

export function PublishModal({
  open,
  slug,
  onClose,
  currentVersion = 0,
  editor = 'ruben@trueomni.com',
}: PublishModalProps) {
  const [phase, setPhase] = useState<Phase>('preview-loading');
  const [files, setFiles] = useState<PublishFileChange[]>([]);
  const [mode, setMode] = useState<'fs' | 'pr'>('fs');
  const [pr, setPr] = useState<PublishPrInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [written, setWritten] = useState(0);
  // Countdown para auto-cerrar el modal tras success.
  const [autoCloseSec, setAutoCloseSec] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase('preview-loading');
    setError(null);
    setWritten(0);
    setPr(null);
    publishToFilesystem(slug, { dryRun: true })
      .then((res) => {
        setFiles(res.files);
        setMode(res.mode);
        setPhase('preview');
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to compute diff';
        // Si el backend reporta runtime read-only o GitHub no configurado,
        // estamos claramente en flujo PR — actualiza el header para que el
        // mensaje 503 cuadre con la intención del operador.
        if (/read-only|github publish/i.test(message)) setMode('pr');
        setError(message);
        setPhase('error');
      });
  }, [open, slug]);

  // Hallazgos S-28 / S-29: Escape + focus trap unificados.
  useEscapeClose(open, onClose);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, dialogRef);

  // Auto-close on done: countdown 3 → 0 segundos. El operador puede
  // cancelar el auto-close cualquier interacción (clicks Cancel/Close).
  useEffect(() => {
    if (phase !== 'done') {
      setAutoCloseSec(null);
      return;
    }
    setAutoCloseSec(3);
    const interval = setInterval(() => {
      setAutoCloseSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, onClose]);

  const changes = files.filter((f) => f.action !== 'unchanged');
  const unchanged = files.filter((f) => f.action === 'unchanged');

  const handleConfirm = async () => {
    setPhase('publishing');
    setError(null);
    try {
      const res = await publishToFilesystem(slug, { dryRun: false });
      setFiles(res.files);
      setWritten(res.written);
      setMode(res.mode);
      setPr(res.pr ?? null);
      // Append al timeline local (audit F-10).
      recordPublishLocal(slug, currentVersion + 1, editor);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
      setPhase('error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-md"
          />
          <motion.div
            key="modal"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto flex max-h-[80vh] w-[600px] max-w-[94vw] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
              <div>
                <h2
                  id="publish-modal-title"
                  className="flex items-center gap-2 font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                >
                  {mode === 'pr' ? (
                    <>
                      <GitPullRequest className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      Publish via Pull Request
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      Publish to filesystem
                    </>
                  )}
                </h2>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {mode === 'pr' ? (
                    <>
                      Opens a PR against <span className="font-mono">main</span> with the diff of{' '}
                      <span className="font-mono">clients/{slug}/</span>. Merge the PR to redeploy.
                    </>
                  ) : (
                    <>
                      Writes the bundle from KV to{' '}
                      <span className="font-mono">clients/{slug}/</span>.
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {phase === 'preview-loading' ? (
                <div className="flex items-center justify-center gap-2 py-12 text-[12px] text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Computing diff…
                </div>
              ) : null}

              {phase === 'error' && error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50/70 px-3 py-2 text-[12px] text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {(phase === 'preview' || phase === 'publishing' || phase === 'done') && (
                <>
                  <SummaryRow files={files} written={phase === 'done' ? written : undefined} />
                  {phase === 'done' && pr ? (
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50/70 px-3 py-2 text-[12px] text-violet-900 transition hover:border-violet-300 hover:bg-violet-100 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-200 dark:hover:bg-violet-900/40"
                    >
                      <GitPullRequest className="h-4 w-4 shrink-0" />
                      <span className="flex-1">
                        PR <strong>#{pr.number}</strong> opened on branch{' '}
                        <span className="font-mono">{pr.branch}</span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    </a>
                  ) : null}
                  {changes.length === 0 && phase === 'preview' ? (
                    <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50/70 px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Filesystem is already up-to-date with KV. Nothing to publish.
                    </div>
                  ) : null}
                  {changes.length > 0 ? <FileList title="Changes" files={changes} /> : null}
                  {unchanged.length > 0 ? (
                    <details className="text-[11.5px]">
                      <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        {unchanged.length} unchanged file
                        {unchanged.length === 1 ? '' : 's'}
                      </summary>
                      <div className="mt-2">
                        <FileList title="" files={unchanged} compact />
                      </div>
                    </details>
                  ) : null}
                </>
              )}

              {phase !== 'preview-loading' ? <StandaloneExportSection slug={slug} /> : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              >
                {phase === 'done'
                  ? autoCloseSec !== null
                    ? `Close (${autoCloseSec})`
                    : 'Close'
                  : 'Cancel'}
              </button>
              {phase === 'error' ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </button>
              ) : phase !== 'done' ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={
                    phase === 'preview-loading' || phase === 'publishing' || changes.length === 0
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  {phase === 'publishing' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {mode === 'pr' ? 'Opening PR…' : 'Publishing…'}
                    </>
                  ) : (
                    <>
                      {mode === 'pr' ? (
                        <GitPullRequest className="h-3.5 w-3.5" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {changes.length > 0
                        ? mode === 'pr'
                          ? `Open PR · ${changes.length} file${changes.length === 1 ? '' : 's'}`
                          : `Publish ${changes.length} file${changes.length === 1 ? '' : 's'}`
                        : 'Nothing to publish'}
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SummaryRow({ files, written }: { files: PublishFileChange[]; written?: number }) {
  const created = files.filter((f) => f.action === 'create').length;
  const updated = files.filter((f) => f.action === 'update').length;
  const unchanged = files.filter((f) => f.action === 'unchanged').length;

  if (written !== undefined) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[12px] text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4" />
        <span>
          <strong>{written}</strong> file{written === 1 ? '' : 's'} written successfully.
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat label="Create" value={created} tone={created > 0 ? 'sky' : 'muted'} />
      <Stat label="Update" value={updated} tone={updated > 0 ? 'amber' : 'muted'} />
      <Stat label="Unchanged" value={unchanged} tone="muted" />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'sky' | 'amber' | 'muted';
}) {
  const cls = {
    sky: 'border-sky-200 bg-sky-50/60 text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200',
    amber:
      'border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200',
    muted:
      'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400',
  }[tone];
  return (
    <div className={`flex flex-col gap-0.5 rounded-md border px-2.5 py-2 ${cls}`}>
      <span className="text-[10.5px] font-medium uppercase tracking-wide">{label}</span>
      <span className="font-display text-[18px] font-semibold">{value}</span>
    </div>
  );
}

function FileList({
  title,
  files,
  compact,
}: {
  title: string;
  files: PublishFileChange[];
  compact?: boolean;
}) {
  return (
    <div className="space-y-1">
      {title ? (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
      ) : null}
      <ul className="space-y-0.5">
        {files.map((f) => (
          <li key={f.path}>
            <div
              className={`flex items-center gap-2 rounded px-2 py-1 ${
                compact
                  ? 'text-zinc-500'
                  : f.action === 'create'
                    ? 'bg-sky-50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200'
                    : f.action === 'update'
                      ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
                      : 'text-zinc-500'
              }`}
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="flex-1 truncate font-mono text-[10.5px]">{shortenPath(f.path)}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase">{f.action}</span>
              {f.action === 'update' && f.sizeBefore !== undefined ? (
                <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                  {f.sizeBefore} → {f.sizeAfter}B
                </span>
              ) : (
                <span className="shrink-0 font-mono text-[10px] text-zinc-500">{f.sizeAfter}B</span>
              )}
            </div>
            {/* JSON key diff (#8 audit) — desplegable solo si el backend
                pobló `changedKeys`. Útil cuando cambia un solo string en
                un config.json de 950KB y el operador quiere saber dónde. */}
            {!compact && f.changedKeys && f.changedKeys.length > 0 ? (
              <details className="ml-6 mt-1">
                <summary className="cursor-pointer text-[10.5px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                  {f.changedKeys.length === 50 ? '50+' : f.changedKeys.length} JSON key
                  {f.changedKeys.length === 1 ? '' : 's'} changed
                </summary>
                <ul className="mt-1 space-y-0.5">
                  {f.changedKeys.map((k) => (
                    <li
                      key={k}
                      className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      {k}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function shortenPath(full: string): string {
  // muestra solo desde "clients/" en adelante
  const idx = full.indexOf('clients/');
  return idx >= 0 ? full.slice(idx) : full;
}

/**
 * Sección "Export as standalone app" — dispara la Action `kiosk-exporter` que
 * genera un repo `kiosk-<slug>` autocontenido (código del producto + todos los
 * assets materializados) + zip. Es asíncrono (la build vive en GitHub Actions);
 * aquí solo disparamos y linkeamos a la run. No interfiere con el flujo fs/pr.
 */
function StandaloneExportSection({ slug }: { slug: string }) {
  const [busy, setBusy] = useState<'kiosk' | 'pwa' | null>(null);
  const [result, setResult] = useState<StandaloneExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (product: 'kiosk' | 'pwa') => {
    setBusy(product);
    setError(null);
    setResult(null);
    try {
      const res = await publishStandalone(slug, product);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Standalone export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <details className="mt-2 rounded-md border border-zinc-200 bg-zinc-50/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
      <summary className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
        <Package className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        Export as standalone app
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          beta
        </span>
      </summary>
      <div className="mt-2 space-y-2">
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Builds a self-contained repo <span className="font-mono">kiosk-{slug}</span> (product code
          + all assets materialized) and a downloadable zip. Runs on GitHub Actions — track progress
          in the build run.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExport('kiosk')}
            disabled={busy !== null}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
          >
            {busy === 'kiosk' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Monitor className="h-3.5 w-3.5" />
            )}
            Export Kiosk
          </button>
          <button
            type="button"
            onClick={() => handleExport('pwa')}
            disabled={busy !== null}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
          >
            {busy === 'pwa' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Smartphone className="h-3.5 w-3.5" />
            )}
            Export PWA
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50/70 px-3 py-2 text-[11.5px] text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {result ? (
          <a
            href={result.runsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[11.5px] text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">
              Build dispatched for <strong>{result.product}</strong> — track the run
            </span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
          </a>
        ) : null}
      </div>
    </details>
  );
}
