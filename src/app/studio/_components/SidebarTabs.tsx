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
  Share2,
  Sparkles,
  Tag,
  Ticket,
  TicketCheck,
  ToggleRight,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

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
}) {
  const isDisabled = (section: StudioSection): boolean => {
    if (!systemModules || !section.systemModuleKey) return false;
    return !systemModules[section.systemModuleKey];
  };

  return (
    <aside className="flex w-[var(--studio-sidebar-w)] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950">
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Studio sections">
        {sections.map((section) => {
          const Icon = ICONS[section.icon] ?? Palette;
          const isActive = activeKey === section.key;
          const disabled = isDisabled(section);

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => !disabled && onSelect(section.key)}
              disabled={disabled}
              aria-disabled={disabled}
              title={
                disabled
                  ? `Turn ${section.label} on in the Modules tab to edit it`
                  : section.title
              }
              className={
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition ' +
                (disabled ? 'cursor-not-allowed opacity-40' : '')
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
                className={`relative grid h-7 w-7 place-items-center rounded-md transition ${
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
      </nav>

      {/* Footer card */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-900">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/50">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Live preview connected</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
            Edits push to the iframe in &lt;120 ms via postMessage.
          </p>
        </div>
      </div>
    </aside>
  );
}
