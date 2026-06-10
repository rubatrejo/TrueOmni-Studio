'use client';

import { motion } from 'framer-motion';
import {
  Bell,
  BookOpen,
  Calendar,
  Camera,
  ClipboardList,
  Compass,
  Database,
  Footprints,
  History,
  Languages,
  LayoutGrid,
  Lock,
  LogIn,
  MapPin,
  Megaphone,
  MonitorPlay,
  MoreHorizontal,
  Palette,
  PenSquare,
  Plug,
  Rocket,
  RotateCcw,
  Route,
  Share2,
  Smartphone,
  Sparkles,
  Tag,
  Ticket,
  TicketCheck,
  ToggleRight,
  Trophy,
  UserCircle,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

import type { SystemModules } from '@/lib/studio/schema';

import type { StudioSection, StudioSectionKey } from '../_lib/sections';
import { useRovingTabList } from '../_lib/use-roving-tab-list';

const ICONS: Record<string, LucideIcon> = {
  Bell,
  BookOpen,
  Calendar,
  Camera,
  ClipboardList,
  Compass,
  Database,
  Footprints,
  History,
  Languages,
  LayoutGrid,
  LogIn,
  MapPin,
  Megaphone,
  MonitorPlay,
  MoreHorizontal,
  Palette,
  PenSquare,
  Plug,
  Rocket,
  Route,
  Share2,
  Smartphone,
  Sparkles,
  Tag,
  Ticket,
  TicketCheck,
  ToggleRight,
  Trophy,
  UserCircle,
  UtensilsCrossed,
};

/**
 * Shape mínimo que `SidebarTabs` necesita de cada sección. `StudioSection`
 * (kiosk) lo satisface, y el editor PWA define sus propias secciones con un
 * key distinto. Genérico en `K` para preservar el tipado fuerte del kiosk
 * (`StudioSectionKey`) sin acoplar la sidebar a un único producto.
 */
export type SidebarSectionLike<K extends string> = {
  key: K;
  label: string;
  title: string;
  icon: string;
  systemModuleKey?: StudioSection['systemModuleKey'];
};

export function SidebarTabs<K extends string = StudioSectionKey>({
  sections,
  activeKey,
  onSelect,
  systemModules,
  bridgeStatus = 'connected',
  onReloadPreview,
}: {
  sections: ReadonlyArray<SidebarSectionLike<K>>;
  activeKey: K;
  onSelect: (key: K) => void;
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
  const isDisabled = (section: SidebarSectionLike<K>): boolean => {
    if (!systemModules || !section.systemModuleKey) return false;
    return !systemModules[section.systemModuleKey];
  };

  const { buttonRefs, handleKeyDown } = useRovingTabList({
    count: sections.length,
    onSelect: (idx) => {
      const section = sections[idx];
      if (section) onSelect(section.key);
    },
    isDisabled: (idx) => isDisabled(sections[idx]),
  });

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
                disabled ? `Turn ${section.label} on in the Modules tab to edit it` : section.title
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
    <div className="space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-900">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/50">
        <div className={`mb-1 flex items-center gap-1.5 text-[11px] ${p.tone}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
          <span>{p.label}</span>
        </div>
        <p
          className="truncate text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500"
          title={p.sub}
        >
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
      {/* Diagnostics link — antes solo accesible via Cmd+K o el StatusBadge
          dot del footer (audit hallazgo #20). Visible y descubrible. */}
      <a
        href="/studio/diagnostics"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="grid h-4 w-4 place-items-center rounded bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </span>
          Diagnostics
        </span>
        <span className="text-zinc-400 dark:text-zinc-600" aria-hidden>
          ↗
        </span>
      </a>
    </div>
  );
}
