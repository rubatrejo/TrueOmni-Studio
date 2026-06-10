'use client';

import { useEscapeClose } from '@/app/studio/_lib/use-modal-a11y';

/**
 * Diálogo de confirmación inline (no modal flotante) — primitiva compartida del
 * Studio. Promovida desde el `DeleteConfirm` inline de ModulesEditor (F-QA-2 del
 * audit STUDIO-AUDIT-2026-06-09) para evitar el drift de copiarlo por editor.
 *
 * Genérico: el caller arma `title`/`description` y los labels. `tone='danger'`
 * (default) usa el estilo rojo de borrado; `tone='neutral'` el gris zinc.
 *
 * F-QA-4: Escape cancela (mejora a11y de un diálogo de confirmación que suele
 * ser destructivo). NO se atrapa el foco: es inline, no un overlay, así que un
 * focus-trap bloquearía tabular al resto de la página.
 */
export function ConfirmDialog({
  id = 'studio-confirm-dialog',
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onCancel,
  onConfirm,
}: {
  id?: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'neutral';
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEscapeClose(true, onCancel);
  const isDanger = tone === 'danger';
  return (
    <div
      role="alertdialog"
      aria-labelledby={id}
      className={
        'mt-3 rounded-md border p-3 ' +
        (isDanger
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40')
      }
    >
      <p
        id={id}
        className={
          'text-[12.5px] font-medium ' +
          (isDanger ? 'text-red-700 dark:text-red-200' : 'text-zinc-800 dark:text-zinc-200')
        }
      >
        {title}
      </p>
      {description ? (
        <p
          className={
            'mt-1 text-[11.5px] ' +
            (isDanger ? 'text-red-600/80 dark:text-red-300/80' : 'text-zinc-500 dark:text-zinc-400')
          }
        >
          {description}
        </p>
      ) : null}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={
            'rounded-md px-2.5 py-1 text-[11.5px] font-medium transition ' +
            (isDanger
              ? 'bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:text-red-200'
              : 'bg-sky-500/20 text-sky-700 hover:bg-sky-500/30 dark:text-sky-200')
          }
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
