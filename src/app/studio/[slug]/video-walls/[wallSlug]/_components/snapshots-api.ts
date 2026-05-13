'use client';

/**
 * Fetch helpers cliente para la API de snapshots de Video Walls.
 *
 * Paridad con `digital-displays/_lib/snapshots-api.ts`.
 */

export interface VideoWallSnapshotMetaClient {
  ts: number;
  savedBy?: string;
  note?: string;
}

export interface VideoWallSnapshotListEntry {
  id: string;
  meta: VideoWallSnapshotMetaClient;
}

function base(client: string, wall: string): string {
  return `/api/studio/video-walls/walls/${encodeURIComponent(client)}/${encodeURIComponent(wall)}/snapshots`;
}

export async function listWallSnapshots(
  clientSlug: string,
  wallSlug: string,
): Promise<VideoWallSnapshotListEntry[]> {
  const res = await fetch(base(clientSlug, wallSlug), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { snapshots?: VideoWallSnapshotListEntry[] };
  return Array.isArray(json.snapshots) ? json.snapshots : [];
}

export async function createWallSnapshot(
  clientSlug: string,
  wallSlug: string,
  note?: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(base(clientSlug, wallSlug), {
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

export async function restoreWallSnapshot(
  clientSlug: string,
  wallSlug: string,
  snapshotId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${base(clientSlug, wallSlug)}/${encodeURIComponent(snapshotId)}/restore`,
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

export async function deleteWallSnapshot(
  clientSlug: string,
  wallSlug: string,
  snapshotId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${base(clientSlug, wallSlug)}/${encodeURIComponent(snapshotId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
