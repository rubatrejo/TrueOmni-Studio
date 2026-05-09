'use client';

import type { SignageClientFile } from '@/lib/signage/schema';

export interface SaveThemeResult {
  ok: boolean;
  error?: string;
}

/**
 * `saveTheme(client)` — persiste el client signage al KV via API.
 *
 * Endpoint `PUT /api/studio/signage/clients/<slug>`. El runtime ya lee
 * KV-first (loadSignageClient), así que el próximo SSR refleja los cambios.
 */
export async function saveTheme(client: SignageClientFile): Promise<SaveThemeResult> {
  try {
    const res = await fetch(`/api/studio/signage/clients/${encodeURIComponent(client.slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client }),
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
