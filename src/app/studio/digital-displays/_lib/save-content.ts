import type { SignageEvent, SignageNewsConfig, SignageSocialData } from '@/lib/signage/schema';

type Result = { ok: true; savedAt: number } | { ok: false; error: string };

async function putContent(
  clientSlug: string,
  kind: 'events' | 'social' | 'news',
  body: object,
): Promise<Result> {
  try {
    const res = await fetch(
      `/api/studio/signage/clients/${encodeURIComponent(clientSlug)}/content?kind=${kind}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { savedAt: number };
    return { ok: true, savedAt: json.savedAt };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const saveSignageEvents = (clientSlug: string, events: SignageEvent[]): Promise<Result> =>
  putContent(clientSlug, 'events', { events });

export const saveSignageSocial = (clientSlug: string, social: SignageSocialData): Promise<Result> =>
  putContent(clientSlug, 'social', { social });

export const saveSignageNews = (clientSlug: string, news: SignageNewsConfig): Promise<Result> =>
  putContent(clientSlug, 'news', { news });
