'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { ChevronRight, Copy, GripVertical, Trash2, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

interface CatalogListProps<T extends { slug: string }> {
  items: T[];
  onReorder: (next: T[]) => void;
  onItemDelete: (slug: string) => void;
  onItemDuplicate?: (slug: string) => void;
  onItemSelect: (slug: string) => void;
  /** Render compacto de la fila — recibido por cada item. */
  renderRow: (item: T) => ReactNode;
  emptyLabel?: string;
  /** Empty state custom (audit F-04). Si se pasa, reemplaza el placeholder
   *  simple de `emptyLabel`. Usar `<EditorEmptyState>` para consistencia. */
  emptyState?: ReactNode;
  /**
   * Bulk operations (audit F-11). Si se pasan callbacks, cada row gana un
   * checkbox a la izquierda y aparece una toolbar contextual cuando hay
   * selección. Reorder se desactiva mientras haya items seleccionados para
   * evitar conflictos de input (drag vs check).
   */
  onItemsBulkDelete?: (slugs: string[]) => void;
  onItemsBulkDuplicate?: (slugs: string[]) => void;
  /** Etiqueta singular del item (e.g. "deal", "event") para el counter. */
  itemNoun?: string;
}

/**
 * Lista de items con drag-reorder (framer-motion `Reorder`) + bulk operations
 * (audit F-11). Click en un row dispara `onItemSelect(slug)` — la edición del
 * item vive en un panel dedicado del editor padre (no inline).
 */
export function CatalogList<T extends { slug: string }>({
  items,
  onReorder,
  onItemDelete,
  onItemDuplicate,
  onItemSelect,
  renderRow,
  emptyLabel = 'No items yet. Click Add to create one.',
  emptyState,
  onItemsBulkDelete,
  onItemsBulkDuplicate,
  itemNoun = 'item',
}: CatalogListProps<T>) {
  const bulkEnabled = Boolean(onItemsBulkDelete || onItemsBulkDuplicate);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // Si la lista cambia (item borrado/añadido externamente), limpiamos los
  // slugs seleccionados que ya no existan.
  useEffect(() => {
    setSelected((curr) => {
      const valid = new Set<string>();
      const itemSlugs = new Set(items.map((i) => i.slug));
      for (const slug of curr) if (itemSlugs.has(slug)) valid.add(slug);
      return valid.size === curr.size ? curr : valid;
    });
  }, [items]);

  const toggleSelect = (slug: string) => {
    setSelected((curr) => {
      const next = new Set(curr);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items.map((i) => i.slug)));
  const clearSelection = () => setSelected(new Set());

  const selectedSlugs = Array.from(selected);
  const allSelected = items.length > 0 && selectedSlugs.length === items.length;

  if (items.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
        <p className="text-[12px] italic text-zinc-500">{emptyLabel}</p>
      </div>
    );
  }

  const reorderDisabled = bulkEnabled && selected.size > 0;

  return (
    <div className="space-y-2">
      {bulkEnabled && selectedSlugs.length > 0 ? (
        <BulkToolbar
          selectedCount={selectedSlugs.length}
          totalCount={items.length}
          allSelected={allSelected}
          itemNoun={itemNoun}
          onSelectAll={selectAll}
          onClear={clearSelection}
          onBulkDuplicate={
            onItemsBulkDuplicate
              ? () => {
                  onItemsBulkDuplicate(selectedSlugs);
                  clearSelection();
                }
              : undefined
          }
          onBulkDelete={
            onItemsBulkDelete
              ? () => {
                  if (
                    !confirm(
                      `Delete ${selectedSlugs.length} ${itemNoun}${
                        selectedSlugs.length === 1 ? '' : 's'
                      }? This cannot be undone.`,
                    )
                  )
                    return;
                  onItemsBulkDelete(selectedSlugs);
                  clearSelection();
                }
              : undefined
          }
        />
      ) : null}

      <Reorder.Group
        axis="y"
        values={items}
        onReorder={(next) => {
          if (reorderDisabled) return;
          onReorder(next);
        }}
        className="space-y-1.5"
      >
        {items.map((item) => (
          <CatalogRow
            key={item.slug}
            item={item}
            onSelect={() => onItemSelect(item.slug)}
            onDelete={() => onItemDelete(item.slug)}
            onDuplicate={onItemDuplicate ? () => onItemDuplicate(item.slug) : undefined}
            renderRow={renderRow}
            selectable={bulkEnabled}
            isSelected={selected.has(item.slug)}
            onToggleSelect={() => toggleSelect(item.slug)}
            reorderDisabled={reorderDisabled}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}

function BulkToolbar({
  selectedCount,
  totalCount,
  allSelected,
  itemNoun,
  onSelectAll,
  onClear,
  onBulkDuplicate,
  onBulkDelete,
}: {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  itemNoun: string;
  onSelectAll: () => void;
  onClear: () => void;
  onBulkDuplicate?: () => void;
  onBulkDelete?: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-md border border-sky-500/30 bg-sky-500/5 px-3 py-1.5 backdrop-blur dark:border-sky-400/30 dark:bg-sky-500/10">
      <div className="flex items-center gap-2 text-[12px] text-sky-800 dark:text-sky-200">
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="grid h-6 w-6 place-items-center rounded text-sky-700 transition hover:bg-sky-500/10 dark:text-sky-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <span className="font-medium">
          {selectedCount} {itemNoun}
          {selectedCount === 1 ? '' : 's'} selected
        </span>
        <span className="text-sky-600/60 dark:text-sky-400/60">·</span>
        {!allSelected ? (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[11.5px] font-medium underline decoration-sky-400/40 underline-offset-2 hover:decoration-sky-400"
          >
            Select all {totalCount}
          </button>
        ) : (
          <span className="text-[11.5px] text-sky-700/70 dark:text-sky-300/70">All selected</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {onBulkDuplicate ? (
          <button
            type="button"
            onClick={onBulkDuplicate}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Copy className="h-3 w-3" />
            Duplicate
          </button>
        ) : null}
        {onBulkDelete ? (
          <button
            type="button"
            onClick={onBulkDelete}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-2.5 py-1 text-[11.5px] font-medium text-red-700 transition hover:bg-red-500/25 dark:text-red-300"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface CatalogRowProps<T extends { slug: string }> {
  item: T;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  renderRow: (item: T) => ReactNode;
  selectable: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  reorderDisabled: boolean;
}

function CatalogRow<T extends { slug: string }>({
  item,
  onSelect,
  onDelete,
  onDuplicate,
  renderRow,
  selectable,
  isSelected,
  onToggleSelect,
  reorderDisabled,
}: CatalogRowProps<T>) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className={
        'overflow-hidden rounded-md border bg-white transition dark:bg-zinc-900/40 ' +
        (isSelected
          ? 'border-sky-500/50 ring-1 ring-sky-500/30 dark:border-sky-400/50 dark:ring-sky-400/30'
          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700')
      }
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        {selectable ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            aria-label={`Select ${item.slug}`}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-sky-500"
          />
        ) : null}

        <button
          type="button"
          onPointerDown={(e) => {
            if (reorderDisabled) return;
            dragControls.start(e);
          }}
          aria-label="Drag to reorder"
          disabled={reorderDisabled}
          className="grid h-6 w-6 cursor-grab place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-left"
        >
          {renderRow(item)}
        </button>

        {onDuplicate ? (
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="Duplicate item"
            className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-sky-500/10 hover:text-sky-600 dark:text-zinc-500 dark:hover:text-sky-300"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete item"
          className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          aria-label="Edit item"
          className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-sky-500/10 hover:text-sky-600 dark:text-zinc-500 dark:hover:text-sky-300"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}
