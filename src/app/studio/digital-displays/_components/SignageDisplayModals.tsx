'use client';

import { AlertTriangle, Copy, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  BaseModal,
  ErrorMessage,
  Field,
  ModalActions,
  SIGNAGE_SLUG_REGEX,
  slugify,
} from './SignageThemeModals';

// ---------------------------------------------------------------------------
//  New display
// ---------------------------------------------------------------------------

export interface NewSignageDisplayModalProps {
  open: boolean;
  clientSlug: string;
  existingSlugs: string[];
  onClose: () => void;
  onCreated: (newSlug: string) => void;
}

export function NewSignageDisplayModal({
  open,
  clientSlug,
  existingSlugs,
  onClose,
  onCreated,
}: NewSignageDisplayModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setSlug('');
      setAutoSlug(true);
      setError(null);
    }
  }, [open]);

  function handleNameChange(v: string) {
    setName(v);
    if (autoSlug) setSlug(slugify(v));
  }

  function handleSlugChange(v: string) {
    setSlug(v);
    setAutoSlug(false);
  }

  async function handleSubmit() {
    setError(null);
    const trimmedSlug = slug.trim();
    const trimmedName = name.trim();
    if (!trimmedName || !trimmedSlug) {
      setError('Name and slug are required.');
      return;
    }
    if (!SIGNAGE_SLUG_REGEX.test(trimmedSlug)) {
      setError('Slug must be kebab-case (a-z, 0-9, dashes).');
      return;
    }
    if (existingSlugs.includes(trimmedSlug)) {
      setError(`A display with slug "${trimmedSlug}" already exists.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/studio/signage/displays/${encodeURIComponent(clientSlug)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: trimmedSlug, name: trimmedName }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      onCreated(trimmedSlug);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="New display"
      icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
      iconClass="bg-sky-500/15 text-sky-600 ring-sky-500/30 dark:text-sky-300"
    >
      <p className="mb-4 text-[13px] text-zinc-500">
        Crea un display nuevo dentro de este theme. Clona la playlist y
        settings de la plantilla <code className="font-mono text-[11.5px]">default → lobby-tv</code>.
      </p>
      <div className="flex flex-col gap-3">
        <Field label="Display name">
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Reception TV"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </Field>
        <Field
          label="Slug"
          hint="Lowercase, dashes. Used in URLs and KV keys."
        >
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="reception-tv"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </Field>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      </div>
      <ModalActions
        primaryLabel={busy ? 'Creating…' : 'Create display'}
        primaryDisabled={busy || !name.trim() || !slug.trim()}
        primaryBusy={busy}
        onPrimary={() => void handleSubmit()}
        onCancel={onClose}
      />
    </BaseModal>
  );
}

// ---------------------------------------------------------------------------
//  Duplicate display
// ---------------------------------------------------------------------------

export interface DuplicateSignageDisplayModalProps {
  open: boolean;
  clientSlug: string;
  sourceSlug: string;
  sourceName: string;
  existingSlugs: string[];
  onClose: () => void;
  onDuplicated: (newSlug: string) => void;
}

export function DuplicateSignageDisplayModal({
  open,
  clientSlug,
  sourceSlug,
  sourceName,
  existingSlugs,
  onClose,
  onDuplicated,
}: DuplicateSignageDisplayModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(`${sourceName} copy`);
      setSlug(`${sourceSlug}-copy`);
      setError(null);
    }
  }, [open, sourceSlug, sourceName]);

  async function handleSubmit() {
    setError(null);
    const trimmedSlug = slug.trim();
    const trimmedName = name.trim();
    if (!trimmedName || !trimmedSlug) {
      setError('Name and slug are required.');
      return;
    }
    if (!SIGNAGE_SLUG_REGEX.test(trimmedSlug)) {
      setError('Slug must be kebab-case.');
      return;
    }
    if (trimmedSlug === sourceSlug) {
      setError('New slug must differ from the source.');
      return;
    }
    if (existingSlugs.includes(trimmedSlug)) {
      setError(`A display with slug "${trimmedSlug}" already exists.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/studio/signage/displays/${encodeURIComponent(
          clientSlug,
        )}/${encodeURIComponent(sourceSlug)}/clone`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newSlug: trimmedSlug, newName: trimmedName }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      onDuplicated(trimmedSlug);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Duplicate display"
      icon={<Copy className="h-4 w-4" strokeWidth={1.75} />}
      iconClass="bg-emerald-500/15 text-emerald-600 ring-emerald-500/30 dark:text-emerald-300"
    >
      <p className="mb-4 text-[13px] text-zinc-500">
        Clona <strong>{sourceName}</strong> con su playlist y settings.
      </p>
      <div className="flex flex-col gap-3">
        <Field label="New name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </Field>
        <Field label="New slug">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </Field>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      </div>
      <ModalActions
        primaryLabel={busy ? 'Duplicating…' : 'Duplicate'}
        primaryDisabled={busy || !name.trim() || !slug.trim()}
        primaryBusy={busy}
        onPrimary={() => void handleSubmit()}
        onCancel={onClose}
      />
    </BaseModal>
  );
}

// ---------------------------------------------------------------------------
//  Delete display
// ---------------------------------------------------------------------------

export interface DeleteSignageDisplayModalProps {
  open: boolean;
  clientSlug: string;
  slug: string;
  name: string;
  isLast: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteSignageDisplayModal({
  open,
  clientSlug,
  slug,
  name,
  isLast,
  onClose,
  onDeleted,
}: DeleteSignageDisplayModalProps) {
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = confirm.trim() === slug;

  useEffect(() => {
    if (open) {
      setConfirm('');
      setError(null);
    }
  }, [open]);

  async function handleDelete() {
    setError(null);
    if (!matches || isLast) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/studio/signage/displays/${encodeURIComponent(
          clientSlug,
        )}/${encodeURIComponent(slug)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      onDeleted();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Delete display"
      icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.75} />}
      iconClass="bg-red-500/15 text-red-600 ring-red-500/30 dark:text-red-400"
    >
      {isLast ? (
        <ErrorMessage>
          No puedes borrar el último display del theme. Crea otro primero o
          elimina el theme entero desde el dashboard.
        </ErrorMessage>
      ) : (
        <>
          <p className="mb-3 text-[13px] text-zinc-700 dark:text-zinc-300">
            Esto borrará <strong>{name}</strong> del KV (display config +
            snapshots) y lo quita del array <code className="font-mono text-[11.5px]">client.displays</code>.
            El filesystem en git no se toca.
          </p>
          <p className="mb-3 text-[12px] text-zinc-500">
            Type <code className="font-mono text-[11.5px]">{slug}</code> to confirm.
          </p>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={slug}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-[12.5px] text-zinc-800 outline-none focus:border-red-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          />
          {error ? (
            <div className="mt-3">
              <ErrorMessage>{error}</ErrorMessage>
            </div>
          ) : null}
        </>
      )}
      <ModalActions
        primaryLabel={busy ? 'Deleting…' : 'Delete display'}
        primaryDisabled={!matches || busy || isLast}
        primaryBusy={busy}
        primaryDestructive
        primaryIcon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2} />}
        onPrimary={() => void handleDelete()}
        onCancel={onClose}
      />
    </BaseModal>
  );
}
