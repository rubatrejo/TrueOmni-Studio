import 'server-only';

import { getGitHubPublishConfig } from '@/lib/studio/github-publisher';
import { isCloudKv } from '@/lib/studio/kv';

import { listSignageClients, listSignageDisplays } from './config';
import { computeSignageKvSize } from './kv-size';

/**
 * Collector de diagnostics signage (DSS8). Server-side, solo lectura.
 *
 * Útil para QA y troubleshooting: cuántos clients/displays existen, cuánto
 * KV usan, si GitHub publish está configurado, si KV es cloud o in-memory.
 */

export interface SignageDiagnostics {
  clients: { count: number; slugs: string[] };
  displays: { totalCount: number; perClient: { client: string; count: number }[] };
  storage: {
    kvCloud: boolean;
    totalBytes: number;
    capBytes: number;
    perDisplay: { client: string; display: string; bytes: number }[];
  };
  publish: {
    githubConfigured: boolean;
    owner?: string;
    repo?: string;
    baseBranch?: string;
  };
}

export async function collectSignageDiagnostics(): Promise<SignageDiagnostics> {
  const clients = await listSignageClients();
  const slugs = clients.map((c) => c.slug);

  const perClient: { client: string; count: number }[] = [];
  let totalDisplays = 0;
  const perDisplay: { client: string; display: string; bytes: number }[] = [];
  let totalBytes = 0;
  let capBytes = 950_000;

  for (const c of clients) {
    const ds = await listSignageDisplays(c.slug);
    perClient.push({ client: c.slug, count: ds.length });
    totalDisplays += ds.length;

    for (const d of ds) {
      try {
        const size = await computeSignageKvSize(c.slug, d.slug);
        capBytes = size.cap;
        perDisplay.push({ client: c.slug, display: d.slug, bytes: size.total });
        totalBytes += size.total;
      } catch {
        perDisplay.push({ client: c.slug, display: d.slug, bytes: 0 });
      }
    }
  }

  const ghConfig = getGitHubPublishConfig();

  return {
    clients: { count: clients.length, slugs },
    displays: { totalCount: totalDisplays, perClient },
    storage: {
      kvCloud: isCloudKv(),
      totalBytes,
      capBytes,
      perDisplay,
    },
    publish: {
      githubConfigured: ghConfig !== null,
      owner: ghConfig?.owner,
      repo: ghConfig?.repo,
      baseBranch: ghConfig?.baseBranch,
    },
  };
}
