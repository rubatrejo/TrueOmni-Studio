import { Octokit } from '@octokit/rest';

/**
 * Publica cambios de un kiosk como PR contra el repo de producción.
 *
 * Estrategia:
 *   1. Obtenemos el SHA del HEAD de la rama base (`baseBranch`, default `main`).
 *   2. Creamos blobs por cada archivo con el contenido nuevo.
 *   3. Construimos un tree nuevo basado en el tree de HEAD con los blobs
 *      sustituidos.
 *   4. Creamos un commit que apunta al tree.
 *   5. Creamos una rama `refs/heads/studio/<slug>/<timestamp>` apuntando al
 *      commit.
 *   6. Abrimos un PR desde esa rama hacia `baseBranch`.
 *
 * Esto evita escribir al filesystem en serverless (Vercel) y deja el approval
 * gate en GitHub: el merge del PR es el evento de "publish definitivo" que
 * dispara el redeploy automático.
 */

interface PublishFile {
  path: string;
  /** Contenido UTF-8 del archivo. */
  content: string;
}

export interface GitHubPublishResult {
  prUrl: string;
  prNumber: number;
  branch: string;
  commitSha: string;
  filesChanged: number;
}

export interface GitHubPublishConfig {
  token: string;
  owner: string;
  repo: string;
  baseBranch?: string;
}

/**
 * Lee la config de GitHub para publicar desde process.env. Si falta cualquier
 * dato esencial devuelve `null` y el caller decide caer al filesystem o
 * devolver 503.
 */
export function getGitHubPublishConfig(): GitHubPublishConfig | null {
  const token = process.env.STUDIO_GITHUB_TOKEN;
  const owner = process.env.STUDIO_GITHUB_OWNER;
  const repo = process.env.STUDIO_GITHUB_REPO;
  if (!token || !owner || !repo) return null;
  return {
    token,
    owner,
    repo,
    baseBranch: process.env.STUDIO_GITHUB_BRANCH ?? 'main',
  };
}

/**
 * Indica si el runtime actual NO puede escribir al filesystem (serverless).
 * En Vercel los archivos son read-only en runtime — el publish debe ir por PR.
 */
export function isReadOnlyRuntime(): boolean {
  return process.env.VERCEL === '1' || process.env.NEXT_RUNTIME === 'edge';
}

export async function publishToGitHub(
  config: GitHubPublishConfig,
  slug: string,
  files: PublishFile[],
  options?: { actorEmail?: string; commitMessage?: string },
): Promise<GitHubPublishResult> {
  if (files.length === 0) {
    throw new Error('No file changes to publish.');
  }

  const baseBranch = config.baseBranch ?? 'main';
  const octokit = new Octokit({ auth: config.token });

  // 1. SHA del HEAD del baseBranch.
  const ref = await octokit.git.getRef({
    owner: config.owner,
    repo: config.repo,
    ref: `heads/${baseBranch}`,
  });
  const baseSha = ref.data.object.sha;

  // 2. Tree SHA del commit base.
  const baseCommit = await octokit.git.getCommit({
    owner: config.owner,
    repo: config.repo,
    commit_sha: baseSha,
  });
  const baseTreeSha = baseCommit.data.tree.sha;

  // 3. Crear blobs en paralelo (concurrency limitada para no agobiar la API).
  const blobs = await mapWithConcurrency(files, 5, async (file) => {
    const blob = await octokit.git.createBlob({
      owner: config.owner,
      repo: config.repo,
      content: Buffer.from(file.content, 'utf8').toString('base64'),
      encoding: 'base64',
    });
    return { path: file.path, sha: blob.data.sha };
  });

  // 4. Construir nuevo tree.
  const tree = await octokit.git.createTree({
    owner: config.owner,
    repo: config.repo,
    base_tree: baseTreeSha,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: '100644',
      type: 'blob',
      sha: b.sha,
    })),
  });

  // 5. Commit.
  const commitMessage =
    options?.commitMessage ??
    `chore(studio): publish ${slug} (${files.length} file${files.length === 1 ? '' : 's'})`;
  const commit = await octokit.git.createCommit({
    owner: config.owner,
    repo: config.repo,
    message: options?.actorEmail
      ? `${commitMessage}\n\nPublished by: ${options.actorEmail}`
      : commitMessage,
    tree: tree.data.sha,
    parents: [baseSha],
  });

  // 6. Branch ref.
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const branchName = `studio/${slug}/${ts}`;
  await octokit.git.createRef({
    owner: config.owner,
    repo: config.repo,
    ref: `refs/heads/${branchName}`,
    sha: commit.data.sha,
  });

  // 7. PR.
  const pr = await octokit.pulls.create({
    owner: config.owner,
    repo: config.repo,
    title: `[studio] Publish ${slug}`,
    head: branchName,
    base: baseBranch,
    body: buildPrBody(slug, files, options?.actorEmail),
  });

  return {
    prUrl: pr.data.html_url,
    prNumber: pr.data.number,
    branch: branchName,
    commitSha: commit.data.sha,
    filesChanged: files.length,
  };
}

function buildPrBody(slug: string, files: PublishFile[], actor?: string): string {
  const fileList = files.map((f) => `- \`${f.path}\``).join('\n');
  return [
    `Studio publish for client \`${slug}\`.`,
    '',
    actor ? `**Published by:** ${actor}` : null,
    `**Files changed:** ${files.length}`,
    '',
    '<details><summary>Affected paths</summary>',
    '',
    fileList,
    '',
    '</details>',
    '',
    'Merging this PR triggers a Vercel redeploy with the new client config.',
  ]
    .filter((s) => s !== null)
    .join('\n');
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const queue = items.map((item, idx) => ({ item, idx }));
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      results[job.idx] = await fn(job.item);
    }
  });
  await Promise.all(workers);
  return results;
}
