'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { ChevronRight, Copy, GripVertical, Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';

interface CatalogListProps<T extends { slug: string }> {
  items: T[];
  onReorder: (next: T[]) => void;
  onItemDelete: (slug: string) => void;
  onItemDuplicate?: (slug: string) => void;
  onItemSelect: (slug: string) => void;
  /** Render compacto de la fila — recibido por cada item. */
  renderRow: (item: T) => ReactNode;
  emptyLabel?: string;
}

/**
 * Lista de items con drag-reorder (framer-motion `Reorder`). Click en un row
 * dispara `onItemSelect(slug)` — la edición del item vive en un panel
 * dedicado del editor padre (no inline).
 */
export function CatalogList<T extends { slug: string }>({
  items,
  onReorder,
  onItemDelete,
  onItemDuplicate,
  onItemSelect,
  renderRow,
  emptyLabel = 'No items yet. Click Add to create one.',
}: CatalogListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
        <p className="text-[12px] italic text-zinc-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
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
        />
      ))}
    </Reorder.Group>
  );
}

interface CatalogRowProps<T extends { slug: string }> {
  item: T;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  renderRow: (item: T) => ReactNode;
}

function CatalogRow<T extends { slug: string }>({
  item,
  onSelect,
  onDelete,
  onDuplicate,
  renderRow,
}: CatalogRowProps<T>) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-md border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          aria-label="Drag to reorder"
          className="grid h-6 w-6 cursor-grab place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
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
