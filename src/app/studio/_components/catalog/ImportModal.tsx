'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  csvTemplateFor,
  detectFormat,
  normalizeImport,
  type ImportItem,
  type ImportKind,
  type ImportMode,
  type ImportResult,
  type ImportStats,
} from '@/app/studio/_lib/import-helpers';
import { useEscapeClose, useFocusTrap } from '@/app/studio/_lib/use-modal-a11y';

interface ImportModalProps<K extends ImportKind> {
  open: boolean;
  kind: K;
  /** Items existentes — se usa para calcular added/updated. */
  existingItems: ImportItem<K>[];
  onClose: () => void;
  onImport: (items: ImportItem<K>[], mode: ImportMode, stats: ImportStats) => void;
}

const KIND_LABELS: Record<ImportKind, { singular: string; plural: string }> = {
  listings: { singular: 'listing', plural: 'listings' },
  events: { singular: 'event', plural: 'events' },
  passes: { singular: 'pass', plural: 'passes' },
  trails: { singular: 'trail', plural: 'trails' },
  ads: { singular: 'ad', plural: 'ads' },
};

export function ImportModal<K extends ImportKind>({
  open,
  kind,
  existingItems,
  onClose,
  onImport,
}: ImportModalProps<K>) {
  const [filename, setFilename] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [mode, setMode] = useState<ImportMode>('merge');
  const [dragActive, setDragActive] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const labels = KIND_LABELS[kind];

  // F-QA-4: Escape para cerrar + atrapar el foco dentro del modal (reemplaza el
  // listener de Escape manual que vivía aquí).
  useEscapeClose(open, onClose);
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) {
      setFilename('');
      setText('');
      setMode('merge');
      setDragActive(false);
      setShowAllErrors(false);
    }
  }, [open]);

  const result: ImportResult<K> | null = useMemo(() => {
    if (!text) return null;
    return normalizeImport({
      kind,
      text,
      format,
      mode,
      existing: existingItems,
    });
  }, [text, format, kind, mode, existingItems]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const content = await file.text();
    setFilename(file.name);
    setText(content);
    setFormat(detectFormat(file.name, content));
    setShowAllErrors(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDownloadTemplate = () => {
    const template = csvTemplateFor(kind);
    const blob = new Blob([template + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kind}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirm = () => {
    if (!result || result.items.length === 0) return;
    onImport(result.items, mode, result.stats);
    onClose();
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
            aria-labelledby="import-modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[8vh] z-50 mx-auto flex max-h-[84vh] w-[640px] max-w-[94vw] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
              <h2
                id="import-modal-title"
                className="font-display text-[15px] font-semibold capitalize text-zinc-900 dark:text-white"
              >
                Import {labels.plural}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {!text ? (
                <DropZone
                  active={dragActive}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  kindPlural={labels.plural}
                />
              ) : (
                <FilePreview
                  kind={kind}
                  filename={filename}
                  format={format}
                  result={result}
                  showAllErrors={showAllErrors}
                  onToggleErrors={() => setShowAllErrors((v) => !v)}
                  onReset={() => {
                    setText('');
                    setFilename('');
                    setShowAllErrors(false);
                  }}
                />
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {!text && (
                <div className="flex items-center justify-between rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-[11.5px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                  <span>
                    Need a starting point? Download a CSV template with the supported columns.
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Template
                  </button>
                </div>
              )}

              {result && result.items.length > 0 && <ModeSelector mode={mode} onChange={setMode} />}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <p className="text-[11px] text-zinc-500">
                Accepted formats: <span className="font-medium">.csv</span>,{' '}
                <span className="font-medium">.json</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!result || result.items.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  {result && result.items.length > 0
                    ? `Import ${result.items.length} ${
                        result.items.length === 1 ? labels.singular : labels.plural
                      }`
                    : 'Import'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DropZone({
  active,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  kindPlural,
}: {
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  kindPlural: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 transition ${
        active
          ? 'border-sky-400 bg-sky-50 dark:border-sky-500/60 dark:bg-sky-500/10'
          : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'
      }`}
    >
      <Upload className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
      <p className="text-[13.5px] font-medium text-zinc-800 dark:text-zinc-200">
        Drop your file here, or click to browse
      </p>
      <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
        CSV or JSON with {kindPlural} data
      </p>
    </button>
  );
}

function FilePreview<K extends ImportKind>({
  kind,
  filename,
  format,
  result,
  showAllErrors,
  onToggleErrors,
  onReset,
}: {
  kind: K;
  filename: string;
  format: 'csv' | 'json';
  result: ImportResult<K> | null;
  showAllErrors: boolean;
  onToggleErrors: () => void;
  onReset: () => void;
}) {
  const FormatIcon = format === 'json' ? FileJson : FileSpreadsheet;
  const errors = result?.errors ?? [];
  const visibleErrors = showAllErrors ? errors : errors.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <FormatIcon className="h-4 w-4 text-zinc-500" />
          <span className="font-mono text-[12px] text-zinc-700 dark:text-zinc-300">
            {filename || `clipboard.${format}`}
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[11.5px] font-medium text-sky-700 transition hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
        >
          Choose another file
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-3 gap-2">
          <Stat
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
            label="Valid"
            value={result.stats.total}
            tone="ok"
          />
          <Stat
            icon={<span className="text-[10px] font-bold text-sky-700 dark:text-sky-300">+/=</span>}
            label={`Added · Updated`}
            value={`${result.stats.added} · ${result.stats.updated}`}
            tone="info"
          />
          <Stat
            icon={<AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />}
            label="Errors"
            value={result.stats.errors}
            tone={result.stats.errors > 0 ? 'danger' : 'muted'}
          />
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1.5 rounded-md border border-red-200 bg-red-50/40 p-2 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-[11.5px] font-semibold text-red-700 dark:text-red-300">
            {errors.length} {errors.length === 1 ? 'error' : 'errors'} skipped during import
          </p>
          <ul className="space-y-0.5">
            {visibleErrors.map((err, idx) => (
              <li key={idx} className="font-mono text-[11px] text-red-700/90 dark:text-red-300/90">
                {err.row > 0 ? `row ${err.row}: ` : ''}
                {err.message}
              </li>
            ))}
          </ul>
          {errors.length > 5 && (
            <button
              type="button"
              onClick={onToggleErrors}
              className="text-[11px] font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-300"
            >
              {showAllErrors ? 'Show fewer' : `Show ${errors.length - 5} more`}
            </button>
          )}
        </div>
      )}

      {result && result.items.length > 0 && <PreviewTable items={result.items} kind={kind} />}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: 'ok' | 'info' | 'danger' | 'muted';
}) {
  const toneClass = {
    ok: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20',
    info: 'border-sky-200 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/20',
    danger: 'border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20',
    muted: 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40',
  }[tone];
  return (
    <div className={`flex flex-col gap-0.5 rounded-md border px-2.5 py-2 ${toneClass}`}>
      <div className="flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-display text-[18px] font-semibold text-zinc-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function PreviewTable({
  items,
  kind,
}: {
  items: ReadonlyArray<Record<string, unknown>>;
  kind: ImportKind;
}) {
  const preview = items.slice(0, 10);
  const isAds = kind === 'ads';
  const keyField = isAds ? 'id' : 'slug';
  const labelField = isAds ? 'kind' : 'title';
  const keyHeader = isAds ? 'ID' : 'Slug';
  const labelHeader = isAds ? 'Kind' : 'Title';
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
      <table className="w-full table-fixed text-left text-[11.5px]">
        <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400">
          <tr>
            <th className="w-10 px-2 py-1.5 font-medium">#</th>
            <th className="w-[42%] px-2 py-1.5 font-medium">{keyHeader}</th>
            <th className="px-2 py-1.5 font-medium">{labelHeader}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {preview.map((item, idx) => (
            <tr key={String(item[keyField] ?? idx)} className="text-zinc-700 dark:text-zinc-300">
              <td className="px-2 py-1.5 font-mono text-zinc-500">{idx + 1}</td>
              <td className="truncate px-2 py-1.5 font-mono">{String(item[keyField] ?? '')}</td>
              <td className="truncate px-2 py-1.5">{String(item[labelField] ?? '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length > preview.length && (
        <p className="border-t border-zinc-100 bg-zinc-50/50 px-2 py-1.5 text-[10.5px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
          + {items.length - preview.length} more
        </p>
      )}
    </div>
  );
}

function ModeSelector({
  mode,
  onChange,
}: {
  mode: ImportMode;
  onChange: (next: ImportMode) => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-[11.5px] font-medium text-zinc-700 dark:text-zinc-300">
        How to apply
      </legend>
      <div className="grid grid-cols-2 gap-2">
        <ModeOption
          checked={mode === 'merge'}
          onChange={() => onChange('merge')}
          label="Merge"
          description="Upsert by slug. Existing items updated, new items appended."
        />
        <ModeOption
          checked={mode === 'replace'}
          onChange={() => onChange('replace')}
          label="Replace"
          description="Wipes the catalog first. Use for full re-imports."
        />
      </div>
    </fieldset>
  );
}

function ModeOption({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 transition ${
        checked
          ? 'border-sky-400 bg-sky-50 dark:border-sky-500/60 dark:bg-sky-500/10'
          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700'
      }`}
    >
      <input
        type="radio"
        name="import-mode"
        aria-label={label}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-3.5 w-3.5 accent-sky-600"
      />
      <span className="space-y-0.5">
        <span className="block text-[12.5px] font-semibold text-zinc-900 dark:text-white">
          {label}
        </span>
        <span className="block text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
          {description}
        </span>
      </span>
    </label>
  );
}
