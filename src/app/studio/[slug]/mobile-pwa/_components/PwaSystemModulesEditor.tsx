'use client';

import {
  BookOpen,
  Calendar,
  ClipboardList,
  Compass,
  Footprints,
  Link2,
  MapPin,
  RotateCcw,
  Route,
  Share2,
  Smartphone,
  Tag,
  Ticket,
  TicketCheck,
  ToggleRight,
  Trophy,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

import {
  isPwaModuleInherited,
  isPwaModuleVisible,
  PWA_ONLY_MODULES,
  PWA_SHARED_MODULES,
} from '@/lib/pwa-module-visibility';
import type { SystemModules } from '@/lib/studio/schema';

import { ToggleSwitch } from '../../../_components/ui';
import { PWA_SECTIONS } from '../_lib/pwa-sections';

/**
 * Panel "Modules" del editor PWA: activa/desactiva módulos. Por default cada
 * módulo COMPARTIDO hereda la visibilidad del Kiosk (`systemModules`); el
 * operador puede override manual aquí. Los módulos PWA-only son toggle manual
 * puro (sin herencia). Un módulo desactivado desaparece del runtime PWA y su
 * sección se bloquea para editar (igual que el editor del Kiosk).
 *
 * La verdad de la herencia vive en `src/lib/pwa-module-visibility.ts`; aquí solo
 * se renderiza el estado efectivo + el control de override/reset.
 */

const ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Compass,
  Calendar,
  TicketCheck,
  Ticket,
  Tag,
  Footprints,
  MapPin,
  BookOpen,
  Share2,
  Route,
  Trophy,
  Smartphone,
  ClipboardList,
  ToggleRight,
  Link2,
};

function moduleInfo(key: string): { label: string; Icon: LucideIcon } {
  const section = PWA_SECTIONS.find((s) => s.key === key);
  return { label: section?.label ?? key, Icon: ICONS[section?.icon ?? ''] ?? ToggleRight };
}

export interface PwaSystemModulesEditorProps {
  /** Override manual actual de la PWA (`features.pwa.moduleVisibility`). */
  moduleVisibility: Record<string, boolean>;
  /** `systemModules` del Kiosk del cliente (read-only) — fuente de la herencia. */
  kioskSystemModules: SystemModules;
  onChange: (next: Record<string, boolean>) => void;
}

export function PwaSystemModulesEditor({
  moduleVisibility,
  kioskSystemModules,
  onChange,
}: PwaSystemModulesEditorProps) {
  const setVisible = (key: string, value: boolean) =>
    onChange({ ...moduleVisibility, [key]: value });

  const reset = (key: string) => {
    const next = { ...moduleVisibility };
    delete next[key];
    onChange(next);
  };

  const renderRow = (key: string, shared: boolean) => {
    const visible = isPwaModuleVisible(key, {
      kioskSystemModules,
      pwaModuleVisibility: moduleVisibility,
    });
    const inherited = shared && isPwaModuleInherited(key, moduleVisibility);
    const { label, Icon } = moduleInfo(key);
    const badge = inherited ? 'Synced with Kiosk' : shared ? 'Manual override' : 'PWA-only';

    return (
      <div
        key={key}
        className={
          'relative flex items-center gap-2.5 rounded-lg border bg-white p-2 transition dark:bg-zinc-900/40 ' +
          (visible
            ? 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70'
            : 'border-dashed border-zinc-200 opacity-60 hover:opacity-100 dark:border-zinc-900')
        }
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {label}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={
                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide ' +
                (inherited
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : shared
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300'
                    : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400')
              }
            >
              {badge}
            </span>
          </div>
        </div>
        {!inherited && shared ? (
          <button
            type="button"
            onClick={() => reset(key)}
            title="Reset to Kiosk (inherit again)"
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        ) : null}
        <ToggleSwitch enabled={visible} onChange={() => setVisible(key, !visible)} label={label} />
      </div>
    );
  };

  return (
    <div className="space-y-7">
      <section>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Shared with Kiosk
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Inherit the Kiosk by default. The Kiosk Portrait is the source of truth — turning a
            module off in the Kiosk turns it off here automatically. Override any module to break
            the sync; press Reset to inherit again.
          </p>
        </header>
        <div className="flex flex-col gap-1.5">
          {PWA_SHARED_MODULES.map((key) => renderRow(key, true))}
        </div>
      </section>

      <section>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            PWA-only
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Modules that exist only in the mobile app. No Kiosk to inherit from — toggle them
            manually.
          </p>
        </header>
        <div className="flex flex-col gap-1.5">
          {PWA_ONLY_MODULES.map((key) => renderRow(key, false))}
        </div>
      </section>
    </div>
  );
}
