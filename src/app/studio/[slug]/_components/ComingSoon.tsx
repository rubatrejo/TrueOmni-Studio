'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { Breadcrumb } from '../../_components/Breadcrumb';
import { StudioBrand } from '../../_components/StudioBrand';

/**
 * Stub visual rico para productos del cliente que aún no están construidos.
 * Reemplaza el placeholder ascético anterior — hallazgo S-14 del audit
 * panorámico v2: los stubs de /mobile-pwa, /video-walls, /tablets eran un
 * placeholder vacío. Ahora muestran teaser informativo + features previstas
 * + timeline distinguible.
 *
 * Hallazgo F-HUB-10: el CTA "Notify me when ready" solo escribía un flag en
 * `localStorage` — no persistía a ningún backend ni disparaba notificación,
 * así que prometía algo que el producto no cumplía. Se degrada a una nota
 * honesta que NO promete aviso, en lugar de montar infra de waitlist.
 */
export interface ComingSoonProps {
  slug: string;
  /** Nombre legible del cliente para el breadcrumb. Cae al slug si falta. */
  clientName?: string;
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
  clientName,
  product,
  description,
  features,
  timeline,
  tone,
  docHref,
}: ComingSoonProps) {
  const preset = TONE_PRESETS[tone];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-zinc-200 bg-white/95 px-5 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/95">
        <div className="flex items-center gap-4">
          <StudioBrand />
          <span className="block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden />
          <Breadcrumb
            items={[
              { label: 'Clients', href: '/studio' },
              { label: clientName ?? slug, href: `/studio/${slug}` },
              { label: product },
            ]}
          />
        </div>
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
              {/* F-HUB-10: nota honesta — no hay backend de waitlist, así que
                  no prometemos un aviso automático. El operador sabe que el
                  producto sigue su roadmap normal. */}
              <span className="text-[12.5px] text-zinc-500 dark:text-zinc-400">
                Not available yet — it ships on the timeline above.
              </span>
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
