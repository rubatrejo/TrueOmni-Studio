'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { Copy, GripVertical, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { ListingsCatalogEntry, ModuleEntry } from '@/lib/studio/schema';

import { ImageField } from '../ImageField';
import { ToggleSwitch } from '../ui';

import { IconNode, IconPickerGrid } from './icons';

/* ────────────────────────────────────────────────────────────────────────── */
/* Filas de módulos — F-QA-1: extraídas de ModulesEditor.                      */
/* SystemRow, ModuleRow (Home tile, drag&drop), ListingModuleRow (CRUD inline).*/
/* Todas son componentes hoja (solo props) — cero estado compartido.           */
/* ────────────────────────────────────────────────────────────────────────── */

export function SystemRow({
  icon,
  iconKey,
  customIcon,
  title,
  subtitle,
  cascade,
  enabled,
  onToggle,
  onIconChange,
  onCustomIcon,
}: {
  icon: ReactNode;
  /** Si se pasa, habilita el icon picker para overrides en `modules.iconOverrides`. */
  iconKey?: string;
  customIcon?: string;
  title: string;
  subtitle: string;
  /** Lista de side-effects al togglear este módulo (audit F-09). */
  cascade?: string;
  enabled: boolean;
  onToggle: () => void;
  onIconChange?: (iconKey: string) => void;
  onCustomIcon?: (dataUrl: string) => void;
}) {
  const [iconMenuOpen, setIconMenuOpen] = useState(false);
  const cascadeMsg = cascade
    ? `Toggling ${title} ${enabled ? 'off' : 'on'} also affects: ${cascade}`
    : undefined;
  const isInteractiveIcon = !!onIconChange;
  return (
    <div
      className={
        'relative flex items-center gap-2.5 rounded-lg border bg-white p-2 transition dark:bg-zinc-900/40 ' +
        (enabled
          ? 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70'
          : 'border-dashed border-zinc-200 opacity-60 hover:opacity-100 dark:border-zinc-900')
      }
    >
      {isInteractiveIcon ? (
        <button
          type="button"
          onClick={() => setIconMenuOpen((v) => !v)}
          title="Change icon"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 transition hover:scale-105 hover:bg-sky-500/10 hover:text-sky-700 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:text-sky-300"
        >
          {customIcon ? <IconNode customIcon={customIcon} className="h-4 w-4" /> : icon}
        </button>
      ) : (
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
          aria-hidden
        >
          {icon}
        </span>
      )}
      {iconMenuOpen && onIconChange ? (
        <div className="absolute left-2 top-12 z-20">
          <IconPickerGrid
            selectedKey={iconKey}
            customIcon={customIcon}
            onPick={(key) => {
              onIconChange(key);
              setIconMenuOpen(false);
            }}
            onCustomChange={(dataUrl) => {
              onCustomIcon?.(dataUrl);
              if (dataUrl) setIconMenuOpen(false);
            }}
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
          {title}
        </div>
        <div className="mt-0.5 truncate text-[10.5px] text-zinc-500 dark:text-zinc-500">
          {subtitle}
        </div>
        {cascade ? (
          <div
            className="mt-1 truncate text-[10px] text-zinc-400 dark:text-zinc-600"
            title={cascadeMsg}
          >
            <span className="font-mono uppercase tracking-wide">Cascades to:</span> {cascade}
          </div>
        ) : null}
      </div>
      <ToggleSwitch enabled={enabled} onChange={onToggle} label={title} title={cascadeMsg} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Home Dashboard tile row                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export function ModuleRow({
  entry,
  iconKey,
  customIcon,
  onToggle,
  onLabel,
  onWide,
  onImage,
}: {
  entry: ModuleEntry;
  /** Pareja resuelta por el caller: prioridad customIcon > iconKey Lucide. */
  iconKey?: string;
  customIcon?: string;
  onToggle: () => void;
  onLabel: (label: string) => void;
  onWide: (wide: boolean) => void;
  onImage: (image: string | undefined) => void;
}) {
  const dragControls = useDragControls();
  const [editing, setEditing] = useState(false);
  const displayLabel = entry.label.replace(/\n/g, ' ');
  const [draft, setDraft] = useState(displayLabel);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(displayLabel);
  }, [displayLabel, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.replace(/\s+/g, ' ').trim();
    if (next.length > 0 && next !== displayLabel) onLabel(next);
    else setDraft(displayLabel);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(displayLabel);
    setEditing(false);
  };

  return (
    <Reorder.Item
      value={entry}
      dragListener={false}
      dragControls={dragControls}
      className={
        'group relative block rounded-lg border bg-white p-2 transition dark:bg-zinc-900/40 ' +
        (entry.enabled
          ? 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70'
          : 'border-dashed border-zinc-200 opacity-60 hover:opacity-100 dark:border-zinc-900')
      }
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${entry.label}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
          aria-hidden
        >
          <IconNode iconKey={iconKey} customIcon={customIcon} className="h-4 w-4" />
        </span>

        <div className="flex flex-1 flex-col">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancel();
                }
              }}
              className="h-7 w-full rounded-md border border-sky-500/50 bg-white px-2 font-display text-[12.5px] font-medium leading-none text-zinc-900 outline-none ring-2 ring-sky-500/20 dark:bg-zinc-950 dark:text-white"
              spellCheck={false}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="block cursor-text truncate rounded-md px-2 py-0.5 text-left font-display text-[12.5px] font-medium leading-snug text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/70"
              title="Click to rename"
            >
              {displayLabel}
            </button>
          )}
          <span className="px-2 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
            /home/{entry.key}
          </span>
        </div>

        {/* Full-width: el tile ocupa las 2 columnas del grid. */}
        <button
          type="button"
          onClick={() => onWide(!entry.wide)}
          aria-pressed={entry.wide ?? false}
          title={
            entry.wide
              ? 'Full width tile (spans 2 columns)'
              : 'Make this tile full width (2 columns)'
          }
          className={
            'shrink-0 rounded-md border px-1.5 py-1 text-[10px] font-semibold transition ' +
            ((entry.wide ?? false)
              ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:border-sky-400/40 dark:text-sky-300'
              : 'border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500')
          }
        >
          Wide
        </button>

        <ToggleSwitch enabled={entry.enabled} onChange={onToggle} label={entry.label} />
      </div>

      {/* Imagen de fondo del tile — editable como en el editor PWA. */}
      <div className="mt-2 pl-[30px]">
        <ImageField
          layout="compact"
          label="Tile image"
          hint="Background photo · JPG · PNG"
          value={entry.image}
          onChange={onImage}
        />
      </div>
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Toggle                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────────────── */
/* ListingModuleRow — fila de un Listing module dinámico con CRUD inline      */
/* ────────────────────────────────────────────────────────────────────────── */

export function ListingModuleRow({
  entry,
  itemCount,
  onToggle,
  onRename,
  onRenameKey,
  onIconChange,
  onCustomIcon,
  onDuplicate,
  onDelete,
}: {
  entry: ListingsCatalogEntry;
  itemCount: number;
  onToggle: () => void;
  onRename: (label: string) => void;
  onRenameKey: (newKey: string) => void;
  onIconChange: (iconKey: string) => void;
  onCustomIcon: (dataUrl: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.label);
  useEffect(() => setDraft(entry.label), [entry.label]);
  const [editingKey, setEditingKey] = useState(false);
  const [draftKey, setDraftKey] = useState(entry.key);
  useEffect(() => setDraftKey(entry.key), [entry.key]);
  const [iconMenuOpen, setIconMenuOpen] = useState(false);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== entry.label) onRename(next);
    setEditing(false);
  };

  const commitKey = () => {
    if (draftKey && draftKey !== entry.key) onRenameKey(draftKey);
    setEditingKey(false);
  };

  return (
    <div className="relative flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-2 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700">
      <button
        type="button"
        onClick={() => setIconMenuOpen((v) => !v)}
        title="Change icon"
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ring-1 transition hover:scale-105 ${
          entry.enabled
            ? 'bg-sky-500/15 text-sky-600 ring-sky-500/30 dark:text-sky-300'
            : 'bg-zinc-100 text-zinc-400 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-600 dark:ring-zinc-700'
        }`}
      >
        <IconNode iconKey={entry.iconKey} customIcon={entry.customIcon} className="h-4 w-4" />
      </button>

      {iconMenuOpen ? (
        <div className="absolute left-2 top-9 z-20">
          <IconPickerGrid
            selectedKey={entry.iconKey}
            customIcon={entry.customIcon}
            onPick={(key) => {
              onIconChange(key);
              setIconMenuOpen(false);
            }}
            onCustomChange={(dataUrl) => {
              onCustomIcon(dataUrl);
              if (dataUrl) setIconMenuOpen(false);
            }}
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(entry.label);
                setEditing(false);
              }
            }}
            className="w-full rounded border border-sky-500/40 bg-white px-1.5 py-0.5 text-[12.5px] font-medium text-zinc-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="block w-full truncate text-left text-[12.5px] font-medium text-zinc-800 hover:text-sky-600 dark:text-zinc-200 dark:hover:text-sky-300"
          >
            {entry.label}
          </button>
        )}
        <div className="truncate text-[10.5px] text-zinc-500">
          {editingKey ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-zinc-500">/</span>
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                type="text"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                onBlur={commitKey}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitKey();
                  if (e.key === 'Escape') {
                    setDraftKey(entry.key);
                    setEditingKey(false);
                  }
                }}
                className="rounded border border-sky-500/40 bg-white px-1 font-mono text-[10px] text-zinc-700 focus:outline-none dark:bg-zinc-900 dark:text-zinc-300"
                size={Math.max(draftKey.length, 8)}
              />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setEditingKey(true)}
              title="Edit slug"
              className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-600 transition hover:bg-sky-500/10 hover:text-sky-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-sky-300"
            >
              /{entry.key}
            </button>
          )}{' '}
          · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </div>
      </div>

      <button
        type="button"
        onClick={onDuplicate}
        aria-label={`Duplicate ${entry.label}`}
        title="Duplicate"
        className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-sky-500/10 hover:text-sky-600 dark:text-zinc-500 dark:hover:text-sky-300"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${entry.label}`}
        title="Delete"
        className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <ToggleSwitch enabled={entry.enabled} onChange={onToggle} label={entry.label} />
    </div>
  );
}
