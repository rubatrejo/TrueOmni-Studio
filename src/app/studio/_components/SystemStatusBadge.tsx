'use client';

import { useEffect, useState } from 'react';

import type { HealthResponse } from '@/app/api/health/route';

/**
 * Badge de estado del sistema (audit F-29).
 *
 * Reemplaza el "All systems operational" estático que vivía en los footers
 * de la home, docs y coming-soon. Pingea `/api/health` al mount y cada
 * 60s. El color del dot refleja el agregado de los probes:
 *
 *   green   → ok
 *   amber   → degraded (memory KV en dev, latencias altas)
 *   red     → down (KV/filesystem unreachable)
 *
 * Tooltip muestra el detalle de cada probe + timestamp del último check.
 * Click abre `/studio/diagnostics` (F-48) con el dump completo.
 */
export function SystemStatusBadge({ className = '' }: { className?: string }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as HealthResponse;
        if (!cancelled) {
          setHealth(body);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch');
          setHealth(null);
        }
      }
    };
    void fetchHealth();
    const id = setInterval(fetchHealth, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const status = error ? 'down' : (health?.status ?? 'loading');

  const dotClass = (() => {
    switch (status) {
      case 'ok':
        return 'bg-emerald-500';
      case 'degraded':
        return 'bg-amber-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-zinc-400 animate-pulse';
    }
  })();

  const label = (() => {
    switch (status) {
      case 'ok':
        return 'All systems operational';
      case 'degraded':
        return 'Degraded · in-memory KV';
      case 'down':
        return 'System down — check diagnostics';
      default:
        return 'Checking…';
    }
  })();

  const tooltip = (() => {
    if (error) return `Health probe failed: ${error}`;
    if (!health) return 'Probing /api/health…';
    const kv = health.probes.kv;
    const fs = health.probes.filesystem;
    return [
      `KV: ${kv.status} (${kv.mode}, ${kv.latencyMs}ms)${kv.detail ? ` — ${kv.detail}` : ''}`,
      `Filesystem: ${fs.status} (${fs.latencyMs}ms)${fs.detail ? ` — ${fs.detail}` : ''}`,
      `Checked ${new Date(health.timestamp).toLocaleTimeString()}`,
    ].join('\n');
  })();

  return (
    <a
      href="/studio/diagnostics"
      title={tooltip}
      aria-label={tooltip}
      className={`flex items-center gap-1.5 rounded-md px-1 py-0.5 transition hover:text-zinc-700 dark:hover:text-zinc-300 ${className}`}
    >
      <span className={`block h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden />
      {label}
    </a>
  );
}
