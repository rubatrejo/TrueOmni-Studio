'use client';

import { Plus, Search } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface CatalogToolbarProps {
  search: string;
  onSearchChange: (next: string) => void;
  onAdd: () => void;
  addLabel?: string;
  /** Si está presente, muestra dropdown de filtro a la derecha. */
  filter?: string;
  onFilterChange?: (next: string) => void;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  /** Conteo total opcional ("12 items"). */
  count?: number;
}

/**
 * Barra superior de un catálogo: search + Add + filtro opcional.
 */
export function CatalogToolbar({
  search,
  onSearchChange,
  onAdd,
  addLabel = 'Add',
  filter,
  onFilterChange,
  filterOptions,
  filterPlaceholder = 'All',
  count,
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
