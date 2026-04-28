'use client';

import { motion } from 'framer-motion';
import {
  Palette,
  LayoutGrid,
  Database,
  Languages,
  Megaphone,
  Plug,
  History,
  Rocket,
  type LucideIcon,
} from 'lucide-react';

import type { StudioSection, StudioSectionKey } from '../_lib/sections';

const ICONS: Record<string, LucideIcon> = {
  Palette,
  LayoutGrid,
  Database,
  Languages,
  Megaphone,
  Plug,
  History,
  Rocket,
};

export function SidebarTabs({
  sections,
  activeKey,
  onSelect,
}: {
  sections: StudioSection[];
  activeKey: StudioSectionKey;
  onSelect: (key: StudioSectionKey) => void;
}) {
  return (
    <aside className="flex w-[var(--studio-sidebar-w)] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950">
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Studio sections">
        {sections.map((section) => {
          const Icon = ICONS[section.icon] ?? Palette;
          const isActive = activeKey === section.key;

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => onSelect(section.key)}
              className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition"
              data-active={isActive}
            >
              {isActive && (
                <motion.span
                  layoutId="studio-sidebar-active"
                  className="absolute inset-0 rounded-lg bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span
                className={`relative grid h-7 w-7 place-items-center rounded-md transition ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-600 ring-1 ring-inset ring-sky-500/30 dark:text-sky-300'
                    : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300'
                }`}
              >
                <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
              </span>
              <span
                className={`relative flex flex-1 flex-col leading-tight ${
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200'
                }`}
              >
                <span className="font-medium">{section.label}</span>
                <span className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
                  {section.num} · {section.phase}
                </span>
              </span>
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
