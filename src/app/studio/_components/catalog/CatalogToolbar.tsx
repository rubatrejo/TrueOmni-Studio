'use client';

import { Download, Plus, Search, Sparkles, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface CatalogToolbarProps {
  search: string;
  onSearchChange: (next: string) => void;
  onAdd: () => void;
  addLabel?: string;
  /** Si está presente, muestra botón "Import" antes del Add. */
  onImport?: () => void;
  importLabel?: string;
  /** Si está presente, muestra dropdown "Export" (CSV/JSON) antes del Import. */
  onExport?: (format: 'csv' | 'json') => void;
  /** Disabled when there's nothing to export. Defaults true. */
  exportEnabled?: boolean;
  /** Si está presente, muestra dropdown de filtro a la derecha. */
  filter?: string;
  onFilterChange?: (next: string) => void;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  /** Conteo total opcional ("12 items"). */
  count?: number;
  /** Si está presente, muestra el botón "✨ Suggest" — abre el AI suggest
   *  modal que añade N items generados por Claude (#26 audit). */
  onAiSuggest?: () => void;
}

/**
 * Barra superior de un catálogo: search + Add + filtro opcional.
 */
export function CatalogToolbar({
  search,
  onSearchChange,
  onAdd,
  addLabel = 'Add',
  onImport,
  importLabel = 'Import',
  onExport,
  exportEnabled = true,
  filter,
  onFilterChange,
  filterOptions,
  filterPlaceholder = 'All',
  count,
  onAiSuggest,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="flex flex-1 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-950">
        <Search className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search…"
          className="flex-1 bg-transparent py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
        {count !== undefined ? (
          <span className="font-mono text-[10.5px] text-zinc-500">{count}</span>
        ) : null}
      </div>

      {filterOptions && onFilterChange ? (
        <select
          value={filter ?? ''}
          onChange={(e) => onFilterChange(e.target.value)}
          aria-label="Filter"
          className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11.5px] text-zinc-700 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          <option value="">{filterPlaceholder}</option>
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}

      {onExport ? (
        <ExportButton onExport={onExport} disabled={!exportEnabled} />
      ) : null}

      {onImport ? (
        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        >
          <Upload className="h-3.5 w-3.5" />
          {importLabel}
        </button>
      ) : null}

      {onAiSuggest ? (
        <button
          type="button"
          onClick={onAiSuggest}
          title="Generate items with AI"
          className="flex items-center gap-1 rounded-md border border-violet-300/60 bg-violet-500/10 px-2.5 py-1.5 text-[11.5px] font-medium text-violet-700 transition hover:bg-violet-500/20 dark:border-violet-500/40 dark:text-violet-300"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Suggest
        </button>
      ) : null}

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 rounded-md bg-sky-500/15 px-2.5 py-1.5 text-[11.5px] font-medium text-sky-700 transition hover:bg-sky-500/25 dark:text-sky-300"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function ExportButton({
  onExport,
  disabled,
}: {
  onExport: (format: 'csv' | 'json') => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (format: 'csv' | 'json') => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>
      {open && !disabled ? (
        <div className="absolute right-0 z-30 mt-1 min-w-[140px] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => choose('csv')}
            className="block w-full px-3 py-1.5 text-left text-[11.5px] text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => choose('json')}
            className="block w-full px-3 py-1.5 text-left text-[11.5px] text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Download JSON
          </button>
        </div>
      ) : null}
    </div>
  );
}
