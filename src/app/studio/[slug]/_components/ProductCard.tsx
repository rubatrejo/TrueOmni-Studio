'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { IntegrationHealthSnapshot } from '@/lib/studio/integrations-health';

/**
 * Card de un producto bajo el cliente. Si está activo, click → editor.
 * Si está live pero no activo, click → POST /products/[product]/activate y
 * luego redirige al editor. Si es coming-soon, queda deshabilitado.
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */
export interface ProductCardProps {
  slug: string;
  /** Segmento del editor (`kiosk`, `digital-displays`, ...). */
  segment: string;
  /** Segmento del endpoint activate (`kiosks`, `digital-displays`, ...).
   *  Diferente del editor `kiosk` (singular) → activate `kiosks` (plural). */
  productSegment: string;
  label: string;
  description: string;
  icon: LucideIcon;
  status: 'live' | 'soon';
  active: boolean;
  /** Timeline para productos `soon`: "In design · Q3 2026", "On roadmap",
   *  "Exploring", etc. Reemplaza el badge genérico "Coming soon". Hallazgo
   *  S-19 del audit panorámico v2. */
  soonTimeline?: string;
  /** Último snapshot de salud de integraciones (F-HUB-7). Solo se pasa a la
   *  card de Kiosks (ahí viven las integraciones); `null` = nunca testeado.
   *  `undefined` = la card no muestra salud de integraciones. */
  integrationsHealth?: IntegrationHealthSnapshot | null;
}

export function ProductCard({
  slug,
  segment,
  productSegment,
  label,
  description,
  icon: Icon,
  status,
  active,
  soonTimeline,
  integrationsHealth,
}: ProductCardProps) {
  const isComingSoon = status === 'soon';
  const href = `/studio/${slug}/${segment}`;
  const router = useRouter();
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    if (activating) return;
    setActivating(true);
    setError(null);
    try {
      const res = await fetch(`/api/studio/clients/${slug}/products/${productSegment}/activate`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `activate failed: ${res.status}`);
      }
      router.push(href);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Activation failed');
      setActivating(false);
    }
  };

  const card = (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-white p-5 transition dark:bg-zinc-900/40 ${
        isComingSoon
          ? 'border-zinc-200 dark:border-zinc-800'
          : 'border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80'
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="flex-1">
          <h3 className="font-display text-[15px] font-semibold leading-tight text-zinc-900 dark:text-white">
            {label}
          </h3>
          <ProductBadge status={status} active={active} soonTimeline={soonTimeline} />
        </div>
      </div>
      <p className="text-[12.5px] leading-relaxed text-zinc-500">{description}</p>
      {integrationsHealth !== undefined && active && (
        <IntegrationsHealthLine health={integrationsHealth} />
      )}
      {!isComingSoon && (
        <div
          className={`mt-4 flex items-center gap-1.5 text-[12px] font-medium ${
            active ? 'text-zinc-700 dark:text-zinc-300' : 'text-sky-700 dark:text-sky-300'
          }`}
        >
          {active ? (
            <>
              Open editor <ArrowRight className="h-3.5 w-3.5" />
            </>
          ) : activating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Activating…
            </>
          ) : (
            <>
              {/* S-20: Activate usa icono distinto (Sparkles) y tono sky
                  para diferenciarse visualmente de "Open editor" (gris +
                  ArrowRight). Es operación pesada (clone desde default). */}
              <Sparkles className="h-3.5 w-3.5" />
              Activate · clones from default
            </>
          )}
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </p>
      )}
    </article>
  );

  if (isComingSoon) {
    return (
      <div aria-disabled className="cursor-not-allowed opacity-60">
        {card}
      </div>
    );
  }
  if (active) {
    return (
      <Link href={href} className="group">
        {card}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => void handleActivate()}
      disabled={activating}
      className="group text-left disabled:cursor-progress"
      aria-label={`Activate ${label}`}
    >
      {card}
    </button>
  );
}

/**
 * Línea de salud de integraciones en la card de Kiosks (F-HUB-7). Refleja el
 * último "Test all" persistido en KV. `null` = nunca testeado.
 */
function IntegrationsHealthLine({ health }: { health: IntegrationHealthSnapshot | null }) {
  const overall = health?.overall ?? 'untested';
  const failing = health?.totals.failed ?? 0;

  const config =
    overall === 'healthy'
      ? {
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          text: 'Integrations healthy',
          cls: 'text-emerald-600 dark:text-emerald-400',
        }
      : overall === 'degraded'
        ? {
            icon: <CircleAlert className="h-3.5 w-3.5" />,
            text: `${failing} integration${failing === 1 ? '' : 's'} failing`,
            cls: 'text-red-600 dark:text-red-400',
          }
        : {
            icon: <CircleDashed className="h-3.5 w-3.5" />,
            text: 'Integrations not tested',
            cls: 'text-zinc-400 dark:text-zinc-600',
          };

  return (
    <span
      className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium ${config.cls}`}
      title={
        health
          ? `${health.totals.ok} ok · ${health.totals.failed} failing · ${health.totals.skipped} not configured`
          : 'Run "Test all configured" in the kiosk Integrations tab'
      }
    >
      {config.icon}
      {config.text}
    </span>
  );
}

function ProductBadge({
  status,
  active,
  soonTimeline,
}: {
  status: 'live' | 'soon';
  active: boolean;
  soonTimeline?: string;
}) {
  if (status === 'soon') {
    return (
      <span
        className="mt-0.5 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
        title={soonTimeline ?? 'Roadmap timing pending'}
      >
        {soonTimeline ?? 'Coming soon'}
      </span>
    );
  }
  if (active) {
    return (
      <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        Active
      </span>
    );
  }
  return (
    <span className="mt-0.5 inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
      Inactive
    </span>
  );
}
