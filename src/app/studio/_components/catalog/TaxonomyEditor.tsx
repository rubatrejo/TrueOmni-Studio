'use client';

import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useState } from 'react';

interface TaxonomyEditorProps {
  label: string;
  /** Lista actual. */
  items: string[];
  onChange: (next: string[]) => void;
  /**
   * Si está presente, el editor reporta cuántos items del catálogo padre
   * dependen de cada string. Borrar uno con uso > 0 abre confirm modal.
   */
  getUsage?: (item: string) => number;
  /**
   * Si está presente, en lugar de input libre + Add, muestra dropdown con
   * estas opciones disponibles (subset). Útil para Tickets que sólo puede
   * elegir categories que existen en Events.
   */
  availableOptions?: string[];
  helpText?: string;
}

/**
 * Editor de taxonomía: lista de strings con add / edit inline / delete + reorder ↑↓.
 *
 * - Con `availableOptions`: dropdown para añadir desde subset disponible
 *   (modo restringido — usado por TicketsEditor).
 * - Sin `availableOptions`: input libre + botón Add (modo libre — el resto).
 */
export function TaxonomyEditor({
  label,
  items,
  onChange,
  getUsage,
  availableOptions,
  helpText,
}: TaxonomyEditorProps) {
  const [draft, setDraft] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{
    idx: number;
    item: string;
    usage: number;
  } | null>(null);

  const isRestricted = Array.isArray(availableOptions);
  const remainingOptions = isRestricted
    ? (availableOptions ?? []).filter((opt) => !items.includes(opt))
    : [];

  const addItem = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (items.includes(next)) return;
    onChange([...items, next]);
    setDraft('');
  };

  const removeAt = (idx: number) => {
    const next = items.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const requestDelete = (idx: number) => {
    const usage = getUsage?.(items[idx]) ?? 0;
    if (usage === 0) {
      removeAt(idx);
      return;
    }
    setConfirmDelete({ idx, item: items[idx], usage });
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditingValue(items[idx]);
  };

  const commitEdit = () => {
    if (editingIdx === null) return;
    const next = editingValue.trim();
    if (!next || next === items[editingIdx]) {
      setEditingIdx(null);
      return;
    }
    if (items.includes(next)) {
      // duplicate — cancel edit silently
      setEditingIdx(null);
      return;
    }
    const updated = items.slice();
    updated[editingIdx] = next;
    onChange(updated);
    setEditingIdx(null);
  };

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="flex items-center justify-between">
        <h4 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          {label}
        </h4>
        <span className="text-[10.5px] text-zinc-500">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-[11px] italic text-zinc-500">No items yet.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, idx) => {
            const usage = getUsage?.(item);
            const isEditing = editingIdx === idx;
            return (
              <li
                key={`${item}-${idx}`}
                className="group flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800/60 dark:bg-zinc-950/40"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    aria-label={`Move ${item} up`}
                    className="grid h-3 w-4 place-items-center text-zinc-600 transition hover:text-sky-300 disabled:opacity-30"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === items.length - 1}
                    aria-label={`Move ${item} down`}
                    className="grid h-3 w-4 place-items-center text-zinc-600 transition hover:text-sky-300 disabled:opacity-30"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                {isEditing ? (
                  <input
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditingIdx(null);
                    }}
                    className="flex-1 rounded border border-sky-500/40 bg-white px-1.5 py-0.5 text-[12px] text-zinc-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(idx)}
                    className="flex-1 truncate text-left text-[12px] text-zinc-700 hover:text-sky-600 dark:text-zinc-200 dark:hover:text-sky-300"
                  >
                    {item}
                  </button>
                )}
                {usage !== undefined && usage > 0 ? (
                  <span className="rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300">
                    {usage}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => requestDelete(idx)}
                  aria-label={`Remove ${item}`}
                  className="grid h-6 w-6 place-items-center rounded text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add row */}
      {isRestricted ? (
        remainingOptions.length === 0 ? (
          <p className="text-[11px] italic text-zinc-500">
            All available options are already added.
          </p>
        ) : (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) addItem(e.target.value);
            }}
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-700 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200"
          >
            <option value="">+ Add from available…</option>
            {remainingOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem(draft);
              }
            }}
            placeholder="New item…"
            className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
          <button
            type="button"
            onClick={() => addItem(draft)}
            disabled={!draft.trim()}
            className="grid h-7 w-7 place-items-center rounded-md bg-sky-500/15 text-sky-300 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Add to ${label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {helpText ? <p className="text-[11px] text-zinc-500">{helpText}</p> : null}

      {/* Confirm delete modal (in-line, no portal) */}
      {confirmDelete ? (
        <div
          role="alertdialog"
          aria-labelledby="taxonomy-confirm-delete"
          className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3"
        >
          <p
            id="taxonomy-confirm-delete"
            className="text-[12px] font-medium text-amber-200"
          >
            {`"${confirmDelete.item}" is used by ${confirmDelete.usage} item${
              confirmDelete.usage === 1 ? '' : 's'
            }.`}
          </p>
          <p className="mt-1 text-[11px] text-amber-400/80">
            Removing it will leave those items with an empty value for this field.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                removeAt(confirmDelete.idx);
                setConfirmDelete(null);
              }}
              className="rounded-md bg-red-500/20 px-2.5 py-1 text-[11px] font-medium text-red-200 transition hover:bg-red-500/30"
            >
              Delete anyway
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
