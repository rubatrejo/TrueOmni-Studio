'use client';

import {
  Copy,
  ExternalLink,
  Monitor,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { SignageDisplayListEntry } from '@/lib/signage/config';

import {
  DeleteSignageDisplayModal,
  DuplicateSignageDisplayModal,
  NewSignageDisplayModal,
} from '../SignageDisplayModals';

/**
 * Tab `Displays` — DSS+: editor read+write con CRUD wizards.
 *
 * - Lista displays del theme con `slug`, `name`, `slidesCount`, link al
 *   editor + Preview en nueva pestaña.
 * - Botón "New display" arriba que clona la plantilla `default → lobby-tv`
 *   y persiste al KV.
 * - Menú "..." per-row con Duplicate / Delete (último display no se puede
 *   borrar — el theme queda inválido sin displays).
 *
 * Endpoints:
 *   POST   /api/studio/signage/displays/[client]
 *   POST   /api/studio/signage/displays/[client]/[displaySlug]/clone
 *   DELETE /api/studio/signage/displays/[client]/[displaySlug]
 */
export interface DisplaysTabProps {
  clientSlug: string;
  displays: SignageDisplayListEntry[];
}

type ModalState =
  | { kind: 'none' }
  | { kind: 'new' }
  | { kind: 'duplicate'; sourceSlug: string; sourceName: string }
  | { kind: 'delete'; slug: string; name: string };

export function DisplaysTab({ clientSlug, displays }: DisplaysTabProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const existingSlugs = displays.map((d) => d.slug);

  function refreshAndClose() {
    setModal({ kind: 'none' });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            Displays
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            {displays.length} display{displays.length === 1 ? '' : 's'} configured
            · click to open editor
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ kind: 'new' })}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New display
        </button>
      </header>

      {displays.length === 0 ? (
        <button
          type="button"
          onClick={() => setModal({ kind: 'new' })}
          className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center transition hover:border-sky-400 hover:bg-sky-50/50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-sky-500/50 dark:hover:bg-sky-950/20"
        >
          <Monitor
            className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-600"
            strokeWidth={1.5}
          />
          <p className="mt-4 text-base font-medium text-zinc-700 dark:text-zinc-300">
            No displays yet
          </p>
          <p className="mt-1 text-[12.5px] text-zinc-500">
            Click to create the first one from the default template.
          </p>
        </button>
      ) : (
        <ul className="flex flex-col gap-2">
          {displays.map((d) => {
            const editorHref = `/studio/digital-displays/${clientSlug}/displays/${d.slug}`;
            const previewHref = `/signage/${clientSlug}/${d.slug}`;
            return (
              <li key={d.slug}>
                <div className="relative flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
                  <Link
                    href={editorHref}
                    className="flex flex-1 items-center gap-3"
                    title={`Open editor for ${d.name}`}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      <Monitor className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-zinc-900 dark:text-white">
                        {d.name}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-zinc-500">
                        <span className="font-mono">{d.slug}</span>
                        <span className="mx-1.5 text-zinc-400 dark:text-zinc-600">
                          ·
                        </span>
                        {d.slidesCount} slide{d.slidesCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </Link>
                  <a
                    href={previewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Preview ${d.name} in new tab`}
                    className="relative z-10 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
                  >
                    Preview
                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  </a>
                  <DisplayRowMenu
                    isLast={displays.length === 1}
                    onDuplicate={() =>
                      setModal({
                        kind: 'duplicate',
                        sourceSlug: d.slug,
                        sourceName: d.name,
                      })
                    }
                    onDelete={() =>
                      setModal({
                        kind: 'delete',
                        slug: d.slug,
                        name: d.name,
                      })
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <NewSignageDisplayModal
        open={modal.kind === 'new'}
        clientSlug={clientSlug}
        existingSlugs={existingSlugs}
        onClose={() => setModal({ kind: 'none' })}
        onCreated={refreshAndClose}
      />
      <DuplicateSignageDisplayModal
        open={modal.kind === 'duplicate'}
        clientSlug={clientSlug}
        sourceSlug={modal.kind === 'duplicate' ? modal.sourceSlug : ''}
        sourceName={modal.kind === 'duplicate' ? modal.sourceName : ''}
        existingSlugs={existingSlugs}
        onClose={() => setModal({ kind: 'none' })}
        onDuplicated={refreshAndClose}
      />
      <DeleteSignageDisplayModal
        open={modal.kind === 'delete'}
        clientSlug={clientSlug}
        slug={modal.kind === 'delete' ? modal.slug : ''}
        name={modal.kind === 'delete' ? modal.name : ''}
        isLast={displays.length <= 1}
        onClose={() => setModal({ kind: 'none' })}
        onDeleted={refreshAndClose}
      />
    </div>
  );
}

/**
 * Menú "..." con Duplicate y Delete por display row. Stop-propagation en
 * click para que no abra el editor (el resto de la fila es un Link).
 */
function DisplayRowMenu({
  isLast,
  onDuplicate,
  onDelete,
}: {
  isLast: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative z-20">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Display actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-8 z-30 flex w-44 flex-col gap-0.5 rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <MenuItem
            icon={<Copy className="h-3.5 w-3.5" strokeWidth={2} />}
            label="Duplicate"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
          />
          <MenuItem
            icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2} />}
            label="Delete"
            destructive
            disabled={isLast}
            disabledTitle="Cannot delete the last display of a theme"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
  disabled,
  disabledTitle,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  disabledTitle?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledTitle : undefined}
      className={`flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-[12.5px] transition ${
        destructive
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {icon}
      {label}
    </button>
  );
}
