'use client';

import { Save, Undo2, Redo2 } from 'lucide-react';

export function SaveBar({
  saveState,
  isDirty,
  onSave,
  onUndo,
  onRedo,
}: {
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-4 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onUndo}
          disabled={!isDirty}
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          aria-label="Discard changes"
          title="Discard unsaved changes"
        >
          <Undo2 className="h-[15px] w-[15px]" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          aria-label="Redo"
          title="⌘⇧Z"
        >
          <Redo2 className="h-[15px] w-[15px]" />
        </button>
        <span className="ml-2 text-[11px] text-zinc-400 dark:text-zinc-600">
          {isDirty ? 'Unsaved changes' : 'No pending changes'}
        </span>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saveState === 'saving' || !isDirty}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:hover:bg-white"
      >
        <Save className="h-3.5 w-3.5" />
        {saveState === 'saving' ? 'Saving…' : saveState === 'saved' && !isDirty ? 'Saved' : 'Save'}
      </button>
    </div>
  );
}
