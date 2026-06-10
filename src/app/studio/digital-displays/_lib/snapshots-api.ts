'use client';

export interface SignageSnapshotMetaClient {
  ts: number;
  savedBy?: string;
  note?: string;
}

export interface SnapshotListEntry {
  id: string;
  meta: SignageSnapshotMetaClient;
}

/**
 * Fetch helpers cliente para la API de snapshots (DSS6).
 */

function base(clientSlug: string, displaySlug: string): string {
  return `/api/studio/signage/displays/${encodeURIComponent(clientSlug)}/${encodeURIComponent(displaySlug)}/snapshots`;
}

export async function listSnapshots(
  clientSlug: string,
  displaySlug: string,
): Promise<SnapshotListEntry[]> {
  const res = await fetch(base(clientSlug, displaySlug), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = (await res.json()) as { snapshots?: SnapshotListEntry[] };
  return Array.isArray(json.snapshots) ? json.snapshots : [];
}

export async function createSnapshot(
  clientSlug: string,
  displaySlug: string,
  note?: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(base(clientSlug, displaySlug), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      id?: string;
      error?: string;
    };
    if (!res.ok || !json.ok) return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    return { ok: true, id: json.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function restoreSnapshot(
  clientSlug: string,
  displaySlug: string,
  snapshotId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${base(clientSlug, displaySlug)}/${encodeURIComponent(snapshotId)}/restore`,
      { method: 'POST' },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
