import 'server-only';

/**
 * Lee los GitHub Releases del repo del Studio y filtra los que están
 * tagged con prefijo `studio-` (convention: `studio-v0.2.0`,
 * `studio-v1.0.0`, etc). El kiosk runtime publica releases sin prefijo
 * y NO deben aparecer en `/studio/docs#changelog`.
 *
 * Source of truth: GitHub Releases. El operador crea un release en
 * `https://github.com/{owner}/{repo}/releases/new` cada vez que ship-ea
 * Studio, y este page lo refleja sin cambios de código.
 *
 * Auth: el repo es privado, así que necesitamos `STUDIO_GITHUB_TOKEN` —
 * la misma env del PR-publish. Si no está set (dev local), devolvemos
 * `null` y el caller cae al fallback hardcoded.
 */

export interface StudioRelease {
  /** Tag completo del release (ej. `studio-v0.2.0`). */
  tag: string;
  /** Versión sin prefijo (`v0.2.0`). */
  version: string;
  /** Título legible o el tag si no hay título. */
  title: string;
  /** Cuerpo markdown del release (puede tener bullets, etc). */
  body: string;
  /** ISO-8601 publication date. */
  publishedAt: string;
  /** URL de GitHub al release. */
  url: string;
  /** True si es un draft o pre-release (los ocultamos por default). */
  isPrerelease: boolean;
}

const STUDIO_TAG_PREFIX = 'studio-';

export async function getStudioReleases(): Promise<StudioRelease[] | null> {
  const token = process.env.STUDIO_GITHUB_TOKEN;
  const owner = process.env.STUDIO_GITHUB_OWNER;
  const repo = process.env.STUDIO_GITHUB_REPO;
  if (!token || !owner || !repo) return null;

  const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=30`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      // Cache server-side por 1h. Cuando publiquen un release nuevo, hasta
      // 60min para que aparezca en /studio/docs. Aceptable para changelog.
      next: { revalidate: 3600 },
    });
  } catch (err) {
    console.warn('[studio/changelog] fetch failed:', err);
    return null;
  }

  if (!res.ok) {
    console.warn('[studio/changelog] GitHub API returned', res.status);
    return null;
  }

  const raw = (await res.json()) as Array<{
    tag_name: string;
    name: string | null;
    body: string | null;
    published_at: string | null;
    created_at: string | null;
    draft: boolean;
    prerelease: boolean;
    html_url: string;
  }>;

  const releases: StudioRelease[] = [];
  for (const r of raw) {
    if (!r.tag_name.startsWith(STUDIO_TAG_PREFIX)) continue;
    if (r.draft) continue; // drafts no se muestran nunca
    const version = r.tag_name.slice(STUDIO_TAG_PREFIX.length);
    releases.push({
      tag: r.tag_name,
      version,
      title: r.name?.trim() || version,
      body: r.body?.trim() || '',
      publishedAt: r.published_at ?? r.created_at ?? new Date().toISOString(),
      url: r.html_url,
      isPrerelease: r.prerelease,
    });
  }

  // Más reciente arriba (GitHub ya los devuelve así, pero por las dudas).
  releases.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return releases;
}

/**
 * Convierte el body markdown de un release a una lista de bullets simple.
 * Acepta líneas que empiecen con `- `, `* ` o `+ `; ignora encabezados,
 * código y otros bloques. Si el body no tiene bullets, devuelve un único
 * item con el texto completo.
 */
export function bodyToBullets(body: string): string[] {
  const lines = body.split('\n').map((l) => l.trim());
  const bullets: string[] = [];
  for (const line of lines) {
    const m = line.match(/^[-*+]\s+(.*)$/);
    if (m && m[1]) bullets.push(m[1]);
  }
  if (bullets.length > 0) return bullets;
  // Fallback: usa el body limpio como un solo item (sin saltos vacíos).
  const clean = body
    .split('\n')
    .filter((l) => l.trim() !== '' && !l.trim().startsWith('#'))
    .join(' ')
    .trim();
  return clean ? [clean] : [];
}

/**
 * Formatea una fecha ISO a un display amigable: "May 4, 2026".
 */
export function formatReleaseDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}
