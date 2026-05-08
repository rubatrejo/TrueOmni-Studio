'use client';

import { Copy, MoreHorizontal, Plus, Trash2, Tv } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

import { StudioPageHeader } from '../../_components/PageHeader';
import type { SignageClientWithDisplays } from '../page';

import {
  DeleteSignageThemeModal,
  DuplicateSignageThemeModal,
  NewSignageThemeModal,
} from './SignageThemeModals';

/**
 * `<ClientsDashboard>` — UI única del editor signage.
 *
 * Sin sub-URLs: cada signage theme se muestra como una card consistente con
 * el ClientCard del kiosk dashboard (mismo `rounded-2xl`, hero `h-40`,
 * body `p-5`, hover lift + shadow). Click en la card abre el editor del
 * theme. Botón "New theme" en el header del listado y menú "..." por card
 * con Duplicate / Delete.
 */
export interface ClientsDashboardProps {
  clients: SignageClientWithDisplays[];
}

export function ClientsDashboard({ clients }: ClientsDashboardProps) {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [dupTarget, setDupTarget] =
    useState<SignageClientWithDisplays | null>(null);
  const [delTarget, setDelTarget] =
    useState<SignageClientWithDisplays | null>(null);

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-24 pt-12 sm:px-8">
      <StudioPageHeader />

      {/* Hero */}
      <section className="mb-12">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          Digital Displays
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance text-zinc-900 sm:text-5xl sm:leading-[1.05] dark:text-white">
          Run scheduled content on lobby TVs.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-zinc-600 dark:text-zinc-400">
          Pixel-perfect 1920×1080 templates with playlist rotation, dayparting,
          weather header, and multi-locale support. Configure once, deploy to any HDMI
          display.
        </p>
      </section>

      {/* Themes section */}
      <section className="flex-1">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
              Your signage themes
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {clients.length} theme{clients.length === 1 ? '' : 's'} on disk
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            New theme
          </button>
        </div>

        {clients.length === 0 ? (
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="block w-full rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center transition hover:border-sky-400 hover:bg-sky-50/50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-sky-700 dark:hover:bg-sky-500/5"
          >
            <Tv
              className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-600"
              strokeWidth={1.5}
            />
            <p className="mt-4 text-base font-medium text-zinc-700 dark:text-zinc-300">
              No signage themes yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Click here to create your first theme — clones the{' '}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] dark:bg-zinc-800">
                default
              </code>{' '}
              template.
            </p>
          </button>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <ThemeCard
                key={c.slug}
                client={c}
                onDuplicate={() => setDupTarget(c)}
                onDelete={() => setDelTarget(c)}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · Digital Displays · Studio v0.1</span>
        <span>Local · main</span>
      </footer>

      <NewSignageThemeModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(slug) => {
          setNewOpen(false);
          router.push(`/studio/digital-displays/${slug}`);
          router.refresh();
        }}
      />
      {dupTarget ? (
        <DuplicateSignageThemeModal
          open={!!dupTarget}
          sourceSlug={dupTarget.slug}
          sourceName={dupTarget.name}
          onClose={() => setDupTarget(null)}
          onDuplicated={(newSlug) => {
            setDupTarget(null);
            router.push(`/studio/digital-displays/${newSlug}`);
            router.refresh();
          }}
        />
      ) : null}
      {delTarget ? (
        <DeleteSignageThemeModal
          open={!!delTarget}
          slug={delTarget.slug}
          name={delTarget.name}
          onClose={() => setDelTarget(null)}
          onDeleted={() => {
            setDelTarget(null);
            router.refresh();
          }}
        />
      ) : null}
    </main>
  );
}

function ThemeCard({
  client,
  onDuplicate,
  onDelete,
}: {
  client: SignageClientWithDisplays;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const editorHref = `/studio/digital-displays/${client.slug}`;
  const isReserved = client.slug === 'default';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md motion-reduce:hover:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 dark:hover:shadow-[0_8px_24px_-12px_rgba(56,189,248,0.25)]">
      <Link
        href={editorHref}
        title={`Open ${client.name} editor`}
        className="absolute inset-0 z-10"
        aria-label={`Open ${client.name} editor`}
      />
      <div
        className="relative grid h-40 w-full place-items-center overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--signage-header-bg)) 0%, hsl(var(--signage-brand-primary)) 100%)',
        }}
      >
        <div
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-2xl"
          style={{ background: 'hsl(var(--signage-brand-primary))' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full opacity-20 blur-2xl"
          style={{ background: 'hsl(var(--signage-events-accent))' }}
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-center">
          {client.slug === 'default' ? (
            <TrueOmniLogo className="h-7 w-auto text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" />
          ) : (
            <span className="font-display text-base font-semibold uppercase tracking-[0.18em] text-white/90 drop-shadow">
              {client.name}
            </span>
          )}
        </div>

        {/* Top-right: displays count badge */}
        <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10.5px] font-medium text-zinc-700 shadow-sm ring-1 ring-white/40 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200 dark:ring-zinc-700">
          <Tv className="h-3 w-3" strokeWidth={2} />
          <span>
            {client.displaysCount} display{client.displaysCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* Slug pill bottom-left */}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/30 px-2.5 py-1 font-mono text-[10.5px] text-white/85 backdrop-blur">
          {client.slug}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-semibold leading-tight text-zinc-900 dark:text-white">
            {client.name}
          </h3>
          <CardMenu
            isReserved={isReserved}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-zinc-500">
          <span>Open editor</span>
          <span className="font-mono text-zinc-400 dark:text-zinc-600">→</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent opacity-0 transition group-hover:opacity-100" />
    </article>
  );
}

/**
 * Menú "..." con Duplicate y Delete por card. Stop-propagation en click para
 * que no abra el editor (el resto de la card es un Link).
 */
function CardMenu({
  isReserved,
  onDuplicate,
  onDelete,
}: {
  isReserved: boolean;
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
        aria-label="Theme actions"
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
            disabled={isReserved}
            disabledTitle="The default theme is reserved and can't be deleted"
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
      title={disabled ? disabledTitle : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] transition ${
        disabled
          ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-600'
          : destructive
            ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
            : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
