import type { SignageEvent, SignageNewsConfig, SignageSocialData } from '@/lib/signage/schema';

type Result = { ok: true; savedAt: number } | { ok: false; error: string };

/**
 * Detail del CustomEvent `signage-content-saved`. Listeners legacy (que
 * solo leen `clientSlug` + `kind` para bumpear `previewKey`) siguen
 * funcionando porque los campos base no cambian; los listeners nuevos
 * (e.g. el `WallEditorShell` que pushea via bridge) pueden leer el
 * `payload` correspondiente para propagar la data al iframe sin reload.
 */
export interface SignageContentSavedDetail {
  clientSlug: string;
  kind: 'events' | 'social' | 'news';
  events?: SignageEvent[];
  social?: SignageSocialData;
  news?: SignageNewsConfig;
}

async function putContent(
  clientSlug: string,
  kind: 'events' | 'social' | 'news',
  body: object,
  detailPayload: Omit<SignageContentSavedDetail, 'clientSlug' | 'kind'>,
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
    // Notificar a editores que escuchan (eg. WallEditorShell del producto
    // Video Walls bumpa previewKey o, mejor, llama a `pushEvents`/`pushSocial`/
    // `pushNews` del bridge live para evitar reload). El detail incluye el
    // payload completo para que el listener no tenga que volver a hacer
    // fetch del KV. Backwards-compat: los listeners viejos siguen leyendo
    // `detail.clientSlug` y `detail.kind` sin tocar el nuevo campo.
    if (typeof window !== 'undefined') {
      const detail: SignageContentSavedDetail = {
        clientSlug,
        kind,
        ...detailPayload,
      };
      window.dispatchEvent(new CustomEvent('signage-content-saved', { detail }));
    }
    return { ok: true, savedAt: json.savedAt };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const saveSignageEvents = (clientSlug: string, events: SignageEvent[]): Promise<Result> =>
  putContent(clientSlug, 'events', { events }, { events });

export const saveSignageSocial = (clientSlug: string, social: SignageSocialData): Promise<Result> =>
  putContent(clientSlug, 'social', { social }, { social });

export const saveSignageNews = (clientSlug: string, news: SignageNewsConfig): Promise<Result> =>
  putContent(clientSlug, 'news', { news }, { news });
