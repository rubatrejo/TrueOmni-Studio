'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Camera,
  Eye,
  Keyboard,
  LayoutGrid,
  Megaphone,
  MonitorPlay,
  Palette,
  Plug,
  Rocket,
  Search,
  Send,
  Sparkles,
  Tag,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { STUDIO_SECTIONS, VERSIONS_SECTION, type StudioSectionKey } from '../_lib/sections';

const SECTION_ICON_OVERRIDE: Partial<Record<StudioSectionKey, LucideIcon>> = {
  branding: Palette,
  modules: LayoutGrid,
  billboard: MonitorPlay,
  'home-dashboard': LayoutGrid,
  'ai-avatar': Sparkles,
  deals: Tag,
  'photo-booth': Camera,
  'digital-brochure': BookOpen,
  tickets: Ticket,
  ads: Megaphone,
  integrations: Plug,
  publish: Rocket,
};

/**
 * Command palette del Studio (audit F-47).
 *
 * Trigger: `Cmd+K` (Mac) / `Ctrl+K` (Win/Linux) en cualquier parte del
 * editor. Lista todas las acciones rápidas disponibles agrupadas por
 * categoría:
 *   - Sections: salta a cualquiera de las 21 secciones del sidebar.
 *   - Actions:  dispara save / publish / open in tab / shortcuts modal.
 *
 * Filtering: substring case-insensitive sobre label + descripción +
 * categoría. Keyboard: ↑↓ navega, Enter ejecuta, Esc cierra.
 *
 * Diseño minimalista — sin cmdk dep externa, todo vanilla React. Si el
 * scope crece (acciones globales del workspace, switch entre kiosks),
 * migrar a `cmdk` + shadcn `<Command>`.
 */
export type CommandAction =
  | { kind: 'section'; key: StudioSectionKey; label: string; description?: string; icon?: LucideIcon }
  | { kind: 'navigate'; href: string; label: string; description?: string; icon?: LucideIcon; external?: boolean }
  | { kind: 'callback'; id: string; label: string; description?: string; icon?: LucideIcon; onSelect: () => void };

export function CommandPalette({
  open,
  onClose,
  onSelectSection,
  slug,
  onPublish,
  onOpenShortcuts,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSelectSection: (key: StudioSectionKey) => void;
  slug: string;
  onPublish: () => void;
  onOpenShortcuts: () => void;
  onSave: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset al abrir/cerrar.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus al input tras el motion.div mount.
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Build list of actions every render (cheap — items son ~25).
  const actions = useMemo<CommandAction[]>(() => {
    const sectionActions: CommandAction[] = STUDIO_SECTIONS.map((s) => ({
      kind: 'section' as const,
      key: s.key,
      label: `Go to ${s.label}`,
      description: s.title,
      icon: SECTION_ICON_OVERRIDE[s.key],
    }));
    sectionActions.push({
      kind: 'section',
      key: VERSIONS_SECTION.key,
      label: `Go to ${VERSIONS_SECTION.label}`,
      description: VERSIONS_SECTION.title,
    });
    const globalActions: CommandAction[] = [
      {
        kind: 'callback',
        id: 'save',
        label: 'Save changes',
        description: 'Cmd+S · Persist current draft to KV',
        icon: Send,
        onSelect: () => {
          onSave();
          onClose();
        },
      },
      {
        kind: 'callback',
        id: 'publish',
        label: 'Open Publish modal',
        description: 'Diff against filesystem + write changes',
        icon: Rocket,
        onSelect: () => {
          onPublish();
          onClose();
        },
      },
      {
        kind: 'navigate',
        href: `/k/${slug}`,
        external: true,
        label: 'Open kiosk in new tab',
        description: `/k/${slug}`,
        icon: Eye,
      },
      {
        kind: 'navigate',
        href: '/studio',
        label: 'All kiosks',
        description: 'Switch to a different kiosk',
        icon: LayoutGrid,
      },
      {
        kind: 'navigate',
        href: '/studio/docs',
        label: 'Open Documentation',
        description: 'Studio docs and changelog',
        icon: BookOpen,
      },
      {
        kind: 'navigate',
        href: '/studio/diagnostics',
        label: 'Open Diagnostics',
        description: 'Bridge status, recent saves, health probes',
        icon: Plug,
      },
      {
        kind: 'callback',
        id: 'shortcuts',
        label: 'Show keyboard shortcuts',
        description: 'Cmd+/',
        icon: Keyboard,
        onSelect: () => {
          onClose();
          // Pequeño delay para que el palette cierre antes de abrir el otro modal.
          setTimeout(() => onOpenShortcuts(), 60);
        },
      },
    ];
    return [...globalActions, ...sectionActions];
  }, [onSave, onPublish, onClose, slug, onOpenShortcuts]);

  // Filter por query (label + description). Score simple: prefix match > contains.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => {
      const hay = `${a.label} ${a.description ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [actions, query]);

  // Asegurar activeIndex válido cuando cambia el filter.
  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIndex]);

  // Scroll into view del active item.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-cmd-idx="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = (action: CommandAction | undefined) => {
    if (!action) return;
    if (action.kind === 'section') {
      onSelectSection(action.key);
      onClose();
    } else if (action.kind === 'callback') {
      action.onSelect();
    } else if (action.kind === 'navigate' && !action.external) {
      // Cierre + dejamos que <Link> maneje la navegación. Pero como aquí no
      // tenemos <Link>, usamos window.location.
      window.location.href = action.href;
      onClose();
    } else if (action.kind === 'navigate' && action.external) {
      window.open(action.href, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-md"
          />
          <motion.div
            key="cmd-modal"
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed left-1/2 top-[12vh] z-50 flex w-[min(560px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/5"
          >
            <div className="flex items-center gap-2.5 border-b border-zinc-200 px-3.5 py-3 dark:border-zinc-900">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search a section…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
              />
              <kbd className="hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-500 sm:inline dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
                Esc
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-[12.5px] italic text-zinc-500">
                  No commands match &ldquo;{query}&rdquo;.
                </div>
              ) : (
                filtered.map((action, idx) => (
                  <CommandItem
                    key={
                      action.kind === 'section'
                        ? `section-${action.key}`
                        : action.kind === 'callback'
                          ? `cb-${action.id}`
                          : `nav-${action.href}`
                    }
                    action={action}
                    active={idx === activeIndex}
                    index={idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onSelect={() => handleSelect(action)}
                  />
                ))
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-zinc-200 px-3.5 py-2 text-[10.5px] text-zinc-500 dark:border-zinc-900 dark:text-zinc-500">
              <span className="flex items-center gap-3">
                <Hint keys={['↑', '↓']}>Navigate</Hint>
                <Hint keys={['↵']}>Select</Hint>
                <Hint keys={['Esc']}>Close</Hint>
              </span>
              <span className="font-mono">
                {filtered.length} of {actions.length}
              </span>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommandItem({
  action,
  active,
  index,
  onMouseEnter,
  onSelect,
}: {
  action: CommandAction;
  active: boolean;
  index: number;
  onMouseEnter: () => void;
  onSelect: () => void;
}) {
  const Icon =
    (action.kind === 'section'
      ? action.icon
      : action.kind === 'callback'
        ? action.icon
        : action.icon) ?? ArrowRight;
  const tag =
    action.kind === 'section'
      ? 'Section'
      : action.kind === 'callback'
        ? 'Action'
        : action.external
          ? 'External'
          : 'Navigate';

  // Si es navigate sin onSelect (interno), usamos <Link> para preservar el
  // routing client-side de Next. Externos van por window.open vía onSelect.
  const isInternalLink = action.kind === 'navigate' && !action.external;
  const InnerContent = (
    <>
      <span
        className={
          'grid h-7 w-7 shrink-0 place-items-center rounded-md ring-1 transition ' +
          (active
            ? 'bg-sky-500/15 text-sky-600 ring-sky-500/30 dark:text-sky-300'
            : 'bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:ring-zinc-800')
        }
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200">
          {action.label}
        </div>
        {action.description ? (
          <div className="truncate text-[10.5px] text-zinc-500 dark:text-zinc-500">
            {action.description}
          </div>
        ) : null}
      </div>
      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
        {tag}
      </span>
    </>
  );

  const wrapClass =
    'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition ' +
    (active ? 'bg-zinc-100 dark:bg-zinc-900' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60');

  if (isInternalLink && action.kind === 'navigate') {
    return (
      <Link
        href={action.href}
        data-cmd-idx={index}
        onMouseEnter={onMouseEnter}
        onClick={onSelect}
        className={wrapClass}
      >
        {InnerContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      data-cmd-idx={index}
      onMouseEnter={onMouseEnter}
      onClick={onSelect}
      className={wrapClass}
    >
      {InnerContent}
    </button>
  );
}

function Hint({ keys, children }: { keys: string[]; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="inline-grid min-w-[16px] place-items-center rounded border border-zinc-200 bg-zinc-50 px-1 py-0 font-mono text-[10px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
        >
          {k}
        </kbd>
      ))}
      <span>{children}</span>
    </span>
  );
}
