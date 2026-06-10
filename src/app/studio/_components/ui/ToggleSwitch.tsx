'use client';

import { Eye, EyeOff } from 'lucide-react';

/**
 * Toggle de visibilidad (switch on/off con icono ojo) — primitiva compartida
 * del Studio. Promovida desde ModulesEditor (F-QA-2 del audit
 * STUDIO-AUDIT-2026-06-09): vivía inline y se duplicaba por editor, con riesgo
 * de drift (como pasó con Breadcrumb/SaveStatusPill).
 *
 * Neutral del Studio (sky-500), no se mezcla con la brand color del cliente.
 */
export function ToggleSwitch({
  enabled,
  onChange,
  label,
  title,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
  /** Tooltip nativo opcional — útil para comunicar cascadas (audit F-09). */
  title?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? 'Hide' : 'Show'} ${label}`}
      title={title}
      onClick={onChange}
      className={
        'relative flex h-6 w-10 shrink-0 items-center rounded-full transition ' +
        (enabled
          ? 'bg-sky-500/90 hover:bg-sky-500 dark:bg-sky-400/80 dark:hover:bg-sky-400'
          : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700')
      }
    >
      <span
        className={
          'flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition ' +
          (enabled ? 'translate-x-[18px]' : 'translate-x-0.5')
        }
      >
        {enabled ? (
          <Eye className="h-2.5 w-2.5 text-sky-600" />
        ) : (
          <EyeOff className="h-2.5 w-2.5 text-zinc-400" />
        )}
      </span>
    </button>
  );
}
