'use client';

import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { VideoWallSlide } from '@/lib/video-walls/schema';

/**
 * <PlaylistsBar> (Video Walls) — clone literal del PlaylistsBar del DD.
 *
 * Tabs estilo kiosk para múltiples playlists con add/rename/delete inline.
 * Reusa el mismo look & feel para mantener consistencia entre productos del
 * Studio. La única diferencia es que tipa los slides como `VideoWallSlide`
 * (vs `SignageSlide` del DD) — el shape de la tupla `{id, name, slides}` es
 * idéntico, así que el render no cambia.
 */
export interface PlaylistsBarProps {
  playlists: { id: string; name: string; slides: VideoWallSlide[] }[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => string;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export function PlaylistsBar({
  playlists,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onRemove,
}: PlaylistsBarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    if (adding && newInputRef.current) newInputRef.current.focus();
  }, [adding]);

  function startRename(id: string, current: string) {
    setRenamingId(id);
    setDraftName(current);
  }

  function commitRename() {
    if (renamingId) {
      onRename(renamingId, draftName);
    }
    setRenamingId(null);
    setDraftName('');
  }

  function cancelRename() {
    setRenamingId(null);
    setDraftName('');
  }

  function commitAdd() {
    const name = newName.trim();
    if (name) {
      onAdd(name);
    }
    setAdding(false);
    setNewName('');
  }

  function cancelAdd() {
    setAdding(false);
    setNewName('');
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-zinc-200 pb-3 dark:border-zinc-800">
      <span className="mr-2 text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
        Playlists
      </span>
      {playlists.map((p) => {
        const isActive = p.id === activeId;
        const isRenaming = renamingId === p.id;
        if (isRenaming) {
          return (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-md border border-sky-400 bg-white px-1.5 py-0.5 dark:border-sky-500/60 dark:bg-zinc-950"
            >
              <input
                ref={renameInputRef}
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') cancelRename();
                }}
                className="w-28 bg-transparent text-[11.5px] text-zinc-800 outline-none dark:text-zinc-200"
              />
              <button
                type="button"
                onClick={commitRename}
                className="grid h-5 w-5 place-items-center rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                title="Confirm"
              >
                <Check className="h-3 w-3" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={cancelRename}
                className="grid h-5 w-5 place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Cancel"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </span>
          );
        }
        return (
          <span
            key={p.id}
            className={`group inline-flex items-center gap-0.5 rounded-md border px-2 py-1 text-[11.5px] transition ${
              isActive
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              className="font-medium"
              title={`Switch to ${p.name}`}
            >
              {p.name}
              <span
                className={`ml-1.5 font-mono text-[10px] ${
                  isActive ? 'text-zinc-300 dark:text-zinc-500' : 'text-zinc-400'
                }`}
              >
                {p.slides.length}
              </span>
            </button>
            {isActive ? (
              <>
                <button
                  type="button"
                  onClick={() => startRename(p.id, p.name)}
                  className="grid h-4 w-4 place-items-center rounded opacity-60 transition hover:opacity-100"
                  title="Rename"
                  aria-label={`Rename ${p.name}`}
                >
                  <Pencil className="h-2.5 w-2.5" strokeWidth={2} />
                </button>
                {playlists.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete playlist "${p.name}"? Its ${p.slides.length} slide(s) will be lost.`,
                        )
                      ) {
                        onRemove(p.id);
                      }
                    }}
                    className="grid h-4 w-4 place-items-center rounded opacity-60 transition hover:bg-red-500/30 hover:opacity-100"
                    title="Delete playlist"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="h-2.5 w-2.5" strokeWidth={2} />
                  </button>
                ) : null}
              </>
            ) : null}
          </span>
        );
      })}

      {adding ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-sky-400 bg-white px-1.5 py-0.5 dark:border-sky-500/60 dark:bg-zinc-950">
          <input
            ref={newInputRef}
            type="text"
            placeholder="Playlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAdd();
              if (e.key === 'Escape') cancelAdd();
            }}
            className="w-28 bg-transparent text-[11.5px] text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
          />
          <button
            type="button"
            onClick={commitAdd}
            disabled={!newName.trim()}
            className="grid h-5 w-5 place-items-center rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 dark:hover:bg-emerald-500/10"
            title="Create"
          >
            <Check className="h-3 w-3" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={cancelAdd}
            className="grid h-5 w-5 place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Cancel"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-zinc-300 px-2 py-1 text-[11px] text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
          title="New playlist"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          New playlist
        </button>
      )}
    </div>
  );
}
