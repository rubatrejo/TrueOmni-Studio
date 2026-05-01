'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Camera,
  ClipboardList,
  Database,
  Footprints,
  History,
  Languages,
  LayoutGrid,
  Lock,
  Megaphone,
  MonitorPlay,
  Palette,
  PenSquare,
  Plug,
  Rocket,
  RotateCcw,
  Share2,
  Sparkles,
  Tag,
  Ticket,
  TicketCheck,
  ToggleRight,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useRef, type KeyboardEvent } from 'react';

import type { SystemModules } from '@/lib/studio/schema';

import type { StudioSection, StudioSectionKey } from '../_lib/sections';

const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Calendar,
  Camera,
  ClipboardList,
  Database,
  Footprints,
  History,
  Languages,
  LayoutGrid,
  Megaphone,
  MonitorPlay,
  Palette,
  PenSquare,
  Plug,
  Rocket,
  Share2,
  Sparkles,
  Tag,
  Ticket,
  TicketCheck,
  ToggleRight,
  UtensilsCrossed,
};

export function SidebarTabs({
  sections,
  activeKey,
  onSelect,
  systemModules,
  bridgeStatus = 'connected',
  onReloadPreview,
}: {
  sections: StudioSection[];
  activeKey: StudioSectionKey;
  onSelect: (key: StudioSectionKey) => void;
  /**
   * Si la sección depende de un módulo (`section.systemModuleKey`) y ese
   * módulo está OFF en `systemModules`, la sección se dibuja en gris y
   * no es clickable.
   */
  systemModules?: SystemModules;
  /** Estado real del bridge postMessage (audit F-17). */
  bridgeStatus?: 'connecting' | 'connected' | 'stale' | 'lost';
  /** Recarga el iframe del preview (incrementa `reloadKey`). */
  onReloadPreview?: () => void;
}) {
  const isDisabled = (section: StudioSection): boolean => {
    if (!systemModules || !section.systemModuleKey) return false;
    return !systemModules[section.systemModuleKey];
  };

  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusAndSelect = (idx: number) => {
    const section = sections[idx];
    if (!section || isDisabled(section)) return;
    onSelect(section.key);
    buttonRefs.current[idx]?.focus();
  };

  const findEnabledIndex = (start: number, dir: 1 | -1): number => {
    const len = sections.length;
    for (let step = 1; step <= len; step++) {
      const i = (start + dir * step + len) % len;
      if (!isDisabled(sections[i])) return i;
    }
    return start;
  };

  const findFirstEnabled = (): number => {
    const i = sections.findIndex((s) => !isDisabled(s));
    return i === -1 ? 0 : i;
  };

  const findLastEnabled = (): number => {
    for (let i = sections.length - 1; i >= 0; i--) {
      if (!isDisabled(sections[i])) return i;
    }
    return sections.length - 1;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIdx: number) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        focusAndSelect(findEnabledIndex(currentIdx, 1));
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        focusAndSelect(findEnabledIndex(currentIdx, -1));
        break;
      case 'Home':
        e.preventDefault();
        focusAndSelect(findFirstEnabled());
        break;
      case 'End':
        e.preventDefault();
        focusAndSelect(findLastEnabled());
        break;
    }
  };

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950 lg:w-[var(--studio-sidebar-w)]">
      {/* Container con role="tablist" — usamos <div> en vez de <nav> porque
         eslint-plugin-jsx-a11y prohíbe asignar roles interactivos a elementos
         estructurales. El aria-label cumple la función semántica de la nav. */}
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label="Studio sections"
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
      >
        {sections.map((section, idx) => {
          const Icon = ICONS[section.icon] ?? Palette;
          const isActive = activeKey === section.key;
          const disabled = isDisabled(section);

          return (
            <button
              key={section.key}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`studio-panel-${section.key}`}
              id={`studio-tab-${section.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !disabled && onSelect(section.key)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              disabled={disabled}
              aria-disabled={disabled}
              title={
                disabled
                  ? `Turn ${section.label} on in the Modules tab to edit it`
                  : section.title
              }
              className={
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ' +
                (disabled
                  ? 'cursor-not-allowed opacity-40'
                  : isActive
                    ? ''
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60')
              }
              data-active={isActive}
            >
              {isActive && !disabled && (
                <motion.span
                  layoutId="studio-sidebar-active"
                  className="absolute inset-0 rounded-lg bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span
                className={`relative grid h-7 w-7 place-items-center rounded-md transition-colors ${
                  disabled
                    ? 'text-zinc-400 dark:text-zinc-600'
                    : isActive
                      ? 'bg-sky-500/15 text-sky-600 ring-1 ring-inset ring-sky-500/30 dark:text-sky-300'
                      : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300'
                }`}
              >
                <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
              </span>
              <span
                className={`relative flex flex-1 leading-tight ${
                  disabled
                    ? 'text-zinc-400 dark:text-zinc-600'
                    : isActive
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-600 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200'
                }`}
              >
                <span className="font-medium">{section.label}</span>
              </span>
              {disabled && (
                <Lock
                  className="relative h-3 w-3 shrink-0 text-zinc-400 dark:text-zinc-600"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer card — bridge status (F-17 audit) */}
      <BridgeStatusCard status={bridgeStatus} onReload={onReloadPreview} />
    </aside>
  );
}

function BridgeStatusCard({
  status,
  onReload,
}: {
  status: 'connecting' | 'connected' | 'stale' | 'lost';
  onReload?: () => void;
}) {
  const presets = {
    connecting: {
      dot: 'bg-sky-500 animate-pulse',
      label: 'Connecting…',
      tone: 'text-sky-600 dark:text-sky-300',
      sub: 'Waiting for kiosk handshake.',
    },
    connected: {
      dot: 'bg-emerald-500',
      label: 'Live preview connected',
      tone: 'text-emerald-600 dark:text-emerald-300',
      sub: 'Edits push to the iframe in <120 ms via postMessage.',
    },
    stale: {
      dot: 'bg-amber-500 animate-pulse',
      label: 'Preview stale',
      tone: 'text-amber-600 dark:text-amber-300',
      sub: 'No heartbeat in 5–30 s. The iframe may be paused.',
    },
    lost: {
      dot: 'bg-red-500',
      label: 'Bridge disconnected',
      tone: 'text-red-600 dark:text-red-400',
      sub: 'No heartbeat for 30 s+. Reload the preview.',
    },
  } as const;
  const p = presets[status];
  const showReload = status === 'stale' || status === 'lost';

  return (
    <div className="border-t border-zinc-200 p-3 dark:border-zinc-900">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/50">
        <div className={`mb-1 flex items-center gap-1.5 text-[11px] ${p.tone}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
          <span>{p.label}</span>
        </div>
        <p className="truncate text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500" title={p.sub}>
          {p.sub}
        </p>
        {showReload && onReload ? (
          <button
            type="button"
            onClick={onReload}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <RotateCcw className="h-3 w-3" />
            Reload preview
          </button>
        ) : null}
      </div>
    </div>
  );
}
