'use client';

import { Plus, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Empty state reusable para los editores del Studio (audit F-04).
 *
 * Reemplaza los placeholders pelados ("No items yet") con un patrón coherente:
 *   - Icono lucide grande (48×48 con anillo).
 *   - Headline corto en font-display.
 *   - Subtext explicando POR QUÉ importa el item.
 *   - CTA primario destacado (icon + label) — opcional.
 *   - Link secundario opcional (docs, learn more) — opcional.
 *
 * Tone: invitar, no avergonzar. Esto es lo PRIMERO que ve un operador en
 * un kiosk recién creado — debe orientar, no juzgar.
 */
export function EditorEmptyState({
  icon: Icon,
  headline,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}: {
  icon: LucideIcon;
  headline: string;
  description: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}) {
  const PrimaryIcon = primaryAction?.icon ?? Plus;
  return (
    <div
      className={
        'flex flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/40 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/20 ' +
        className
      }
    >
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="font-display text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">
        {headline}
      </h3>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        {description}
      </p>
      {primaryAction || secondaryAction ? (
        <div className="mt-5 flex items-center gap-2">
          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <PrimaryIcon className="h-3.5 w-3.5" />
              {primaryAction.label}
            </button>
          ) : null}
          {secondaryAction ? (
            secondaryAction.href ? (
              <a
                href={secondaryAction.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11.5px] font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-800 hover:decoration-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {secondaryAction.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="text-[11.5px] font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-800 hover:decoration-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {secondaryAction.label}
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
