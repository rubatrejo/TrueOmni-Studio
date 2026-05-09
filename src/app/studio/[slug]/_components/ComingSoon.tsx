'use client';

import { ArrowLeft, Bell, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

/**
 * Stub visual rico para productos del cliente que aún no están construidos.
 * Reemplaza el placeholder ascético anterior — hallazgo S-14 del audit
 * panorámico v2: los stubs de /mobile-pwa, /video-walls, /tablets eran un
 * placeholder vacío. Ahora muestran teaser informativo + features previstas
 * + timeline distinguible + "Notify me when ready" (waitlist local).
 *
 * La waitlist no envía email todavía — guarda el flag en `localStorage` con
 * scope por slug + product. El consumer de la API puede leerlo después.
 */
export interface ComingSoonProps {
  slug: string;
  product: 'Mobile PWA' | 'Video Walls' | 'Tablets';
  /** Resumen breve del producto. */
  description: string;
  /** Lista de features previstas (3-5 bullets). */
  features: ReadonlyArray<string>;
  /** Timeline relativo: "In design · Q3 2026", "On roadmap · Q4 2026", "Exploring · 2027". */
  timeline: string;
  /** Tono visual del badge timeline. */
  tone: 'design' | 'roadmap' | 'exploring';
  /** Link opcional a documentación pública. */
  docHref?: string;
}

const TONE_PRESETS = {
  design: {
    badge:
      'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/40',
    accent: 'from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-400/15 dark:via-sky-400/5',
  },
  roadmap: {
    badge:
      'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/40',
    accent:
      'from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-400/15 dark:via-amber-400/5',
  },
  exploring: {
    badge:
      'bg-zinc-200 text-zinc-700 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
    accent:
      'from-zinc-400/15 via-zinc-400/5 to-transparent dark:from-zinc-500/15 dark:via-zinc-500/5',
  },
} as const;

export function ComingSoon({
  slug,
  product,
  description,
  features,
  timeline,
  tone,
  docHref,
}: ComingSoonProps) {
  const preset = TONE_PRESETS[tone];
  const storageKey = `studio:waitlist:${slug}:${product}`;
  const [subscribed, setSubscribed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(storageKey) === '1';
  });

  const handleSubscribe = () => {
    try {
      window.localStorage.setItem(storageKey, '1');
      setSubscribed(true);
    } catch {
      setSubscribed(true); // best-effort si localStorage está bloqueado
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-zinc-200 bg-white/95 px-5 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/95">
        <Link
          href={`/studio/${slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to client
        </Link>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-12 sm:px-10 sm:py-16">
        <div
          className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-10`}
        >
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${preset.accent}`}
          />
          <div className="relative">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ${preset.badge}`}
            >
              {timeline}
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
              {product}
            </h1>
            <p className="mt-3 max-w-prose text-[14.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              {description}
            </p>

            <h2 className="mt-8 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
              What we&apos;re planning
            </h2>
            <ul className="mt-3 space-y-2">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-zinc-700 dark:text-zinc-300"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 grid h-1.5 w-1.5 shrink-0 place-items-center rounded-full bg-zinc-400 dark:bg-zinc-600"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              {subscribed ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1.5 text-[12.5px] font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Check className="h-3.5 w-3.5" />
                  We&apos;ll let you know
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSubscribe}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[12.5px] font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <Bell className="h-3.5 w-3.5" />
                  Notify me when ready
                </button>
              )}
              {docHref && (
                <a
                  href={docHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
                >
                  Read the brief
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Link
                href={`/studio/${slug}`}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                Back to client
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
