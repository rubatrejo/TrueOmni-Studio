'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Copy, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
//  Generic modal shell
// ---------------------------------------------------------------------------

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: ReactNode;
  iconClass: string;
  children: ReactNode;
}

function BaseModal({
  open,
  onClose,
  title,
  icon,
  iconClass,
  children,
}: BaseModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] grid place-items-center p-4">
          <motion.div
            key="signage-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-[min(440px,100%)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/5"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="px-6 pb-5 pt-6">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ${iconClass}`}
                >
                  {icon}
                </span>
                <h2 className="font-display text-[18px] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                  {title}
                </h2>
              </div>
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
//  New theme
// ---------------------------------------------------------------------------

export interface NewSignageThemeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (slug: string) => void;
}

export function NewSignageThemeModal({
  open,
  onClose,
  onCreated,
}: NewSignageThemeModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required.');
      return;
    }
    if (!SLUG_REGEX.test(slug)) {
      setError('Slug must be kebab-case (a-z, 0-9, dashes).');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/studio/signage/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      onCreated(slug);
      // Reset for next open.
      setName('');
      setSlug('');
      setAutoSlug(true);
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
      title="New signage theme"
      icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
      iconClass="bg-sky-500/15 text-sky-600 ring-sky-500/30 dark:text-sky-300"
    >
      <p className="mb-4 text-[13px] text-zinc-500">
        Clona el template <code className="font-mono text-[11.5px]">default</code>{' '}
        con tu nombre y slug. Después editas branding/header/displays.
      </p>
      <div className="flex flex-col gap-3">
        <Field label="Display name">
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Trueomni HQ Lobby"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </Field>
        <Field label="Slug" hint="Lowercase, dashes. Used in URLs and KV keys.">
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="trueomni-hq"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </Field>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      </div>
      <ModalActions
        primaryLabel={busy ? 'Creating…' : 'Create theme'}
        primaryDisabled={busy || !name.trim() || !slug.trim()}
        primaryBusy={busy}
        onPrimary={() => void handleSubmit()}
        onCancel={onClose}
      />
    </BaseModal>
  );
}

// ---------------------------------------------------------------------------
//  Duplicate theme
// ---------------------------------------------------------------------------

export interface DuplicateSignageThemeModalProps {
  open: boolean;
  sourceSlug: string;
  sourceName: string;
  onClose: () => void;
  onDuplicated: (newSlug: string) => void;
}

export function DuplicateSignageThemeModal({
  open,
  sourceSlug,
  sourceName,
  onClose,
  onDuplicated,
}: DuplicateSignageThemeModalProps) {
  const [name, setName] = useState(`${sourceName} copy`);
  const [slug, setSlug] = useState(`${sourceSlug}-copy`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required.');
      return;
    }
    if (!SLUG_REGEX.test(slug)) {
      setError('Slug must be kebab-case.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/studio/signage/clients/${encodeURIComponent(sourceSlug)}/clone`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newSlug: slug, newName: name }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      onDuplicated(slug);
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
      title="Duplicate theme"
      icon={<Copy className="h-4 w-4" strokeWidth={1.75} />}
      iconClass="bg-emerald-500/15 text-emerald-600 ring-emerald-500/30 dark:text-emerald-300"
    >
      <p className="mb-4 text-[13px] text-zinc-500">
        Clona <strong>{sourceName}</strong> con todos sus displays, branding e i18n.
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
//  Delete theme
// ---------------------------------------------------------------------------

export interface DeleteSignageThemeModalProps {
  open: boolean;
  slug: string;
  name: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteSignageThemeModal({
  open,
  slug,
  name,
  onClose,
  onDeleted,
}: DeleteSignageThemeModalProps) {
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = confirm.trim() === slug;

  async function handleDelete() {
    setError(null);
    if (!matches) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/studio/signage/clients/${encodeURIComponent(slug)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      onDeleted();
      setConfirm('');
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
      title="Delete theme"
      icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.75} />}
      iconClass="bg-red-500/15 text-red-600 ring-red-500/30 dark:text-red-400"
    >
      <p className="mb-3 text-[13px] text-zinc-700 dark:text-zinc-300">
        Esto borrará <strong>{name}</strong> del KV (client.json, displays,
        snapshots y bags i18n). El filesystem en git no se toca; para
        eliminar definitivamente requiere PR.
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
      <ModalActions
        primaryLabel={busy ? 'Deleting…' : 'Delete theme'}
        primaryDisabled={!matches || busy}
        primaryBusy={busy}
        primaryDestructive
        primaryIcon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2} />}
        onPrimary={() => void handleDelete()}
        onCancel={onClose}
      />
    </BaseModal>
  );
}

// ---------------------------------------------------------------------------
//  Primitives
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="text-[11px] text-zinc-400">{hint}</span>
      ) : null}
    </label>
  );
}

function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:bg-red-500/10 dark:text-red-400">
      {children}
    </p>
  );
}

function ModalActions({
  primaryLabel,
  primaryDisabled,
  primaryBusy,
  primaryDestructive,
  primaryIcon,
  onPrimary,
  onCancel,
}: {
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryBusy?: boolean;
  primaryDestructive?: boolean;
  primaryIcon?: ReactNode;
  onPrimary: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-50 ${
          primaryDestructive
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200'
        }`}
      >
        {primaryBusy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
        ) : (
          primaryIcon
        )}
        {primaryLabel}
      </button>
    </div>
  );
}
