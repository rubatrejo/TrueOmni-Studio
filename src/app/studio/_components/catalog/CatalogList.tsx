'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { ChevronDown, ChevronRight, Copy, GripVertical, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface CatalogListProps<T extends { slug: string }> {
  items: T[];
  onReorder: (next: T[]) => void;
  onItemChange: (slug: string, patch: Partial<T>) => void;
  onItemDelete: (slug: string) => void;
  onItemDuplicate?: (slug: string) => void;
  /** Render compacto de la fila colapsada — recibido por cada item. */
  renderRow: (item: T) => ReactNode;
  /** Render del form expandido. Recibe el item y handlers tipados. */
  renderForm: (item: T, onChange: (patch: Partial<T>) => void) => ReactNode;
  emptyLabel?: string;
}

/**
 * Lista de items con drag-reorder (framer-motion `Reorder`) + accordion expand
 * (single-mode: solo uno expandido a la vez). Cada row tiene drag handle, expand
 * chevron, duplicate, delete.
 */
export function CatalogList<T extends { slug: string }>({
  items,
  onReorder,
  onItemChange,
  onItemDelete,
  onItemDuplicate,
  renderRow,
  renderForm,
  emptyLabel = 'No items yet. Click Add to create one.',
}: CatalogListProps<T>) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/20 px-4 py-10 text-center">
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
          expanded={expandedSlug === item.slug}
          onToggle={() =>
            setExpandedSlug((prev) => (prev === item.slug ? null : item.slug))
          }
          onChange={(patch) => onItemChange(item.slug, patch)}
          onDelete={() => onItemDelete(item.slug)}
          onDuplicate={onItemDuplicate ? () => onItemDuplicate(item.slug) : undefined}
          renderRow={renderRow}
          renderForm={renderForm}
        />
      ))}
    </Reorder.Group>
  );
}

interface CatalogRowProps<T extends { slug: string }> {
  item: T;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<T>) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  renderRow: (item: T) => ReactNode;
  renderForm: (item: T, onChange: (patch: Partial<T>) => void) => ReactNode;
}

function CatalogRow<T extends { slug: string }>({
  item,
  expanded,
  onToggle,
  onChange,
  onDelete,
  onDuplicate,
  renderRow,
  renderForm,
}: CatalogRowProps<T>) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/40"
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          aria-label="Drag to reorder"
          className="grid h-6 w-6 cursor-grab place-items-center rounded text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse item' : 'Expand item'}
          className="grid h-6 w-6 place-items-center rounded text-zinc-500 transition hover:bg-zinc-800 hover:text-sky-300"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          {renderRow(item)}
        </button>

        {onDuplicate ? (
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="Duplicate item"
            className="grid h-7 w-7 place-items-center rounded text-zinc-500 transition hover:bg-sky-500/10 hover:text-sky-300"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete item"
          className="grid h-7 w-7 place-items-center rounded text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-zinc-800 bg-zinc-950/40 p-3">
          {renderForm(item, onChange)}
        </div>
      ) : null}
    </Reorder.Item>
  );
}
