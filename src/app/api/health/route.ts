import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { isCloudKv, kv, kvKeys } from '@/lib/studio/kv';

/**
 * `/api/health` — health probe del backend del Studio (audit F-29).
 *
 * El badge "All systems operational" del footer (home + coming-soon + docs)
 * antes era estático. Ahora pinga este endpoint cada vez que se renderiza
 * el footer y muestra el estado real:
 *
 *   - **kv**: leer la lista de clientes del store (`clients:list`). Si la
 *     llamada explota o tarda >2s, lo marcamos `down`. Si estamos en
 *     fallback in-memory (sin credenciales Upstash), reportamos `degraded`
 *     en lugar de `ok` — el operador debe saber que sus edits no
 *     persisten entre reinicios.
 *
 *   - **filesystem**: stat sobre `clients/_template/config.json`. Cualquier
 *     `EACCES`/`ENOENT` indica disco mal montado o permisos rotos. El
 *     publish flow depende 100% del filesystem.
 *
 * El payload es deliberadamente simple para que el cliente (footer +
 * Diagnostics page F-48) no tenga que hacer schema validation. El response
 * SIEMPRE es 200 — incluso si los probes fallan — porque queremos que el
 * cliente lo distinga del "endpoint not found" o "5xx" del network layer.
 */

type ProbeStatus = 'ok' | 'degraded' | 'down';

export interface HealthResponse {
  status: ProbeStatus; // worst-case agregado
  timestamp: string;
  probes: {
    kv: { status: ProbeStatus; latencyMs: number; mode: 'cloud' | 'memory'; detail?: string };
    filesystem: { status: ProbeStatus; latencyMs: number; detail?: string };
  };
}

const PROBE_TIMEOUT_MS = 2000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`probe timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function probeKv(): Promise<HealthResponse['probes']['kv']> {
  const t0 = Date.now();
  const mode: 'cloud' | 'memory' = isCloudKv() ? 'cloud' : 'memory';
  try {
    await withTimeout(kv.smembers(kvKeys.clientsList), PROBE_TIMEOUT_MS);
    const latency = Date.now() - t0;
    // Memory KV técnicamente "funciona" pero no persiste — reportar degraded
    // para que el operador sepa que está en modo dev.
    if (mode === 'memory') {
      return {
        status: 'degraded',
        latencyMs: latency,
        mode,
        detail: 'In-memory fallback. Edits do not persist across server restarts.',
      };
    }
    return { status: 'ok', latencyMs: latency, mode };
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - t0,
      mode,
      detail: err instanceof Error ? err.message : 'unknown error',
    };
  }
}

async function probeFilesystem(): Promise<HealthResponse['probes']['filesystem']> {
  const t0 = Date.now();
  const probePath = path.join(process.cwd(), 'clients', '_template', 'config.json');
  try {
    const stat = await withTimeout(fs.stat(probePath), PROBE_TIMEOUT_MS);
    if (!stat.isFile()) {
      return {
        status: 'down',
        latencyMs: Date.now() - t0,
        detail: 'clients/_template/config.json is not a regular file',
      };
    }
    return { status: 'ok', latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - t0,
      detail: err instanceof Error ? err.message : 'unknown error',
    };
  }
}

function aggregateStatus(...statuses: ProbeStatus[]): ProbeStatus {
  if (statuses.includes('down')) return 'down';
  if (statuses.includes('degraded')) return 'degraded';
  return 'ok';
}

export async function GET() {
  const [kvProbe, fsProbe] = await Promise.all([probeKv(), probeFilesystem()]);
  const body: HealthResponse = {
    status: aggregateStatus(kvProbe.status, fsProbe.status),
    timestamp: new Date().toISOString(),
    probes: {
      kv: kvProbe,
      filesystem: fsProbe,
    },
  };
  // No-cache: el footer pollea esto y queremos respuestas frescas siempre.
  return NextResponse.json(body, {
    headers: { 'cache-control': 'no-store' },
  });
}

// Forzar dynamic — Next intenta cachear/SSG las routes sin params; aquí queremos
// que cada GET ejecute los probes en el server.
export const dynamic = 'force-dynamic';
