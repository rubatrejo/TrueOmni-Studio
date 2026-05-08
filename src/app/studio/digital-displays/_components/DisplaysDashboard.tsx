'use client';

import { Copy, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

import { StudioPageHeader } from '../../_components/PageHeader';
import type { DisplayCardEntry } from '../page';

import {
  DeleteSignageDisplayModal,
  DuplicateSignageDisplayModal,
  NewSignageDisplayModal,
} from './SignageDisplayModals';

/**
 * `<DisplaysDashboard>` — UI principal del editor signage.
 *
 * Lista plana de displays cross-clients. Cada card representa un display
 * (no un theme/cliente). Mismo lenguaje visual que el kiosks dashboard:
 * `rounded-2xl`, hero `h-40`, body `p-5`, hover lift + shadow + add card al
 * final.
 */
export interface DisplaysDashboardProps {
  cards: DisplayCardEntry[];
}

export function DisplaysDashboard({ cards }: DisplaysDashboardProps) {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [dupTarget, setDupTarget] = useState<DisplayCardEntry | null>(null);
  const [delTarget, setDelTarget] = useState<DisplayCardEntry | null>(null);

  const existingDisplaySlugs = cards
    .filter((c) => !dupTarget || c.clientSlug === dupTarget.clientSlug)
    .map((c) => c.displaySlug);

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-24 pt-12 sm:px-8">
      <StudioPageHeader />

      {/* Hero */}
      <section className="mb-12">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          Digital Displays
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance text-zinc-900 sm:text-5xl sm:leading-[1.05] dark:text-white">
          Engage your audience with smart digital signage.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-zinc-600 dark:text-zinc-400">
          Pixel-perfect 1920×1080 templates for hospitality, retail and
          transportation. Schedule playlists, integrate weather and social
          feeds, and run multi-locale content on any HDMI display — no JSON,
          no terminals.
        </p>
      </section>

      {/* Displays section */}
      <section className="flex-1">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
              Your digital displays
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {cards.length} display{cards.length === 1 ? '' : 's'} configured
            </p>
          </div>
          <NewDisplayButton onClick={() => setNewOpen(true)} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <DisplayCard
              key={`${card.clientSlug}::${card.displaySlug}`}
              card={card}
              onDuplicate={() => setDupTarget(card)}
              onDelete={() => setDelTarget(card)}
            />
          ))}
          <NewDisplayCard onClick={() => setNewOpen(true)} />
        </div>
      </section>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · Digital Displays · Studio v0.1</span>
        <span>Local · main</span>
      </footer>

      <NewSignageDisplayModal
        open={newOpen}
        clientSlug="default"
        existingSlugs={cards
          .filter((c) => c.clientSlug === 'default')
          .map((c) => c.displaySlug)}
        onClose={() => setNewOpen(false)}
        onCreated={(newDisplaySlug) => {
          setNewOpen(false);
          router.push(`/studio/digital-displays/default/displays/${newDisplaySlug}`);
          router.refresh();
        }}
      />
      {dupTarget ? (
        <DuplicateSignageDisplayModal
          open={!!dupTarget}
          clientSlug={dupTarget.clientSlug}
          sourceSlug={dupTarget.displaySlug}
          sourceName={dupTarget.displayName}
          existingSlugs={existingDisplaySlugs}
          onClose={() => setDupTarget(null)}
          onDuplicated={(newSlug) => {
            const target = dupTarget;
            setDupTarget(null);
            router.push(
              `/studio/digital-displays/${target.clientSlug}/displays/${newSlug}`,
            );
            router.refresh();
          }}
        />
      ) : null}
      {delTarget ? (
        <DeleteSignageDisplayModal
          open={!!delTarget}
          clientSlug={delTarget.clientSlug}
          slug={delTarget.displaySlug}
          name={delTarget.displayName}
          isLast={
            cards.filter((c) => c.clientSlug === delTarget.clientSlug)
              .length <= 1
          }
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

// ---------------------------------------------------------------------------
//  Card
// ---------------------------------------------------------------------------

function DisplayCard({
  card,
  onDuplicate,
  onDelete,
}: {
  card: DisplayCardEntry;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const editorHref = `/studio/digital-displays/${card.clientSlug}/displays/${card.displaySlug}`;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md motion-reduce:hover:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 dark:hover:shadow-[0_8px_24px_-12px_rgba(56,189,248,0.25)]">
      <Link
        href={editorHref}
        title={`Open ${card.displayName} editor`}
        className="absolute inset-0 z-10"
        aria-label={`Open ${card.displayName} editor`}
      />
      <div
        className="relative grid h-40 w-full place-items-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${card.brandPrimary} 0%, ${card.brandSecondary} 100%)`,
        }}
      >
        <div
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-2xl"
          style={{ background: card.brandAccent }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full opacity-20 blur-2xl"
          style={{ background: card.brandAccent }}
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-center">
          {card.isReserved ? (
            <TrueOmniLogo className="h-7 w-auto text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" />
          ) : card.logoUrl ? (
            <Image
              src={card.logoUrl}
              alt=""
              width={120}
              height={28}
              unoptimized
              className="h-7 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
            />
          ) : (
            <span className="font-display text-base font-semibold uppercase tracking-[0.18em] text-white/90 drop-shadow">
              {card.displayName}
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10.5px] font-medium text-zinc-700 shadow-sm ring-1 ring-white/40 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200 dark:ring-zinc-700">
          {card.slidesCount} slide{card.slidesCount === 1 ? '' : 's'}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/30 px-2.5 py-1 font-mono text-[10.5px] text-white/85 backdrop-blur">
          {card.displaySlug}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-semibold leading-tight text-zinc-900 dark:text-white">
            {card.displayName}
          </h3>
          <CardMenu
            isReserved={card.isReserved}
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
            disabled={isReserved}
            disabledTitle="The default display is reserved and can't be deleted"
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

// ---------------------------------------------------------------------------
//  Add card / button
// ---------------------------------------------------------------------------

function NewDisplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      New display
    </button>
  );
}

function NewDisplayCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-zinc-100 text-left transition hover:border-zinc-400 hover:from-white hover:to-zinc-100 hover:shadow-md dark:border-zinc-800 dark:from-zinc-900/40 dark:to-zinc-900/80 dark:hover:border-zinc-700 dark:hover:from-zinc-900/60 dark:hover:to-zinc-900"
    >
      <div className="relative grid h-40 w-full place-items-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgb(212_212_216_/_0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgb(212_212_216_/_0.5)_1px,transparent_1px)] [background-size:20px_20px] dark:opacity-20 dark:[background-image:linear-gradient(to_right,rgb(63_63_70)_1px,transparent_1px),linear-gradient(to_bottom,rgb(63_63_70)_1px,transparent_1px)]"
          aria-hidden="true"
        />
        <div className="relative grid h-12 w-12 place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-500 shadow-sm transition group-hover:border-zinc-400 group-hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:border-zinc-600 dark:group-hover:text-zinc-200">
          <Plus className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-semibold leading-tight text-zinc-700 transition group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-white">
            New digital display
          </h3>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-zinc-500">
          <span>Clone from template</span>
          <span className="font-mono">⌘N</span>
        </div>
      </div>
    </button>
  );
}
