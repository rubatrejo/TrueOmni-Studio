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
  /** True si el PR quedó marcado como auto-merge (espera CI verde). False si
   *  el operador no lo pidió o si GitHub rechazó la mutation. */
  autoMergeEnabled?: boolean;
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

/**
 * Lee el contenido UTF-8 de un archivo del repo en una ref específica.
 * Útil para el surgical edit de `tokens.css` en `mode=pr`: necesitamos
 * el CSS actual del repo para preservar tokens custom y solo reemplazar
 * los 3 brand colors. Devuelve `null` si el archivo no existe (404 de
 * la API).
 */
export async function getRepoFileContent(
  config: GitHubPublishConfig,
  filePath: string,
  ref?: string,
): Promise<string | null> {
  const octokit = new Octokit({ auth: config.token });
  try {
    const res = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: filePath,
      ref: ref ?? config.baseBranch ?? 'main',
    });
    // `getContent` puede devolver array (directorio) o object (archivo).
    if (Array.isArray(res.data) || res.data.type !== 'file') {
      throw new Error(`Path '${filePath}' is not a file in the repo.`);
    }
    if (!('content' in res.data) || typeof res.data.content !== 'string') {
      throw new Error(`Repo file '${filePath}' has no inline content.`);
    }
    // El content viene base64 (encoding 'base64' confirmado por el shape).
    return Buffer.from(res.data.content, 'base64').toString('utf8');
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) return null;
    throw err;
  }
}

export async function publishToGitHub(
  config: GitHubPublishConfig,
  slug: string,
  files: PublishFile[],
  options?: {
    actorEmail?: string;
    commitMessage?: string;
    /**
     * Si `true`, intenta hacer auto-merge del PR via GitHub API tras crearlo.
     * Requiere que la repo tenga "Auto-merge" habilitado en settings y que el
     * PR cumpla los requisitos de protected branch (CI verde, reviews, etc.).
     * Si el merge falla por checks pendientes, GitHub lo ejecutará cuando los
     * checks pasen. Si los checks fallan o el PR es rechazado, el operador
     * tiene que mergearlo a mano. Hallazgo #23 del audit.
     */
    autoMerge?: boolean;
  },
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

  // 8. Auto-merge opcional (hallazgo #23 del audit). El backend usa la GraphQL
  // mutation `enablePullRequestAutoMerge` para que GitHub haga merge cuando
  // todos los checks de CI pasen. Si la repo no tiene auto-merge habilitado o
  // el PR no cumple las protected-branch rules, capturamos el error y devolve-
  // mos el PR igualmente (el operador puede mergear a mano).
  let autoMergeEnabled = false;
  if (options?.autoMerge) {
    try {
      await octokit.graphql(
        `mutation($pullRequestId: ID!) {
          enablePullRequestAutoMerge(input: {
            pullRequestId: $pullRequestId,
            mergeMethod: SQUASH
          }) {
            pullRequest { autoMergeRequest { enabledAt } }
          }
        }`,
        { pullRequestId: pr.data.node_id },
      );
      autoMergeEnabled = true;
    } catch (e) {
      console.warn('[github-publisher] auto-merge failed', e);
    }
  }

  return {
    prUrl: pr.data.html_url,
    prNumber: pr.data.number,
    branch: branchName,
    commitSha: commit.data.sha,
    filesChanged: files.length,
    autoMergeEnabled,
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

/* ─────────────────────────────────────────────────────────────────────────
 * Standalone export — dispatch de la Action `export-standalone.yml`
 * ──────────────────────────────────────────────────────────────────────── */

/** Owner/repo/workflow del builder de kiosks standalone. */
export const EXPORTER_OWNER = 'rubatrejo';
export const EXPORTER_REPO = 'kiosk-exporter';
export const EXPORTER_WORKFLOW = 'export-standalone.yml';

export interface ExporterDispatchConfig {
  token: string;
  owner: string;
  repo: string;
  workflow: string;
  ref: string;
}

/**
 * Lee la config para disparar la Action del builder desde process.env. El
 * token (`EXPORTER_GITHUB_TOKEN`) es el mismo gh token de Rubén con scope
 * repo+workflow (ya configurado como secret del builder; en Vercel va como
 * env var del proyecto del Studio). Si falta devuelve `null` y el caller
 * responde 503.
 */
export function getExporterDispatchConfig(): ExporterDispatchConfig | null {
  const token = process.env.EXPORTER_GITHUB_TOKEN;
  if (!token) return null;
  return {
    token,
    owner: process.env.EXPORTER_GITHUB_OWNER ?? EXPORTER_OWNER,
    repo: process.env.EXPORTER_GITHUB_REPO ?? EXPORTER_REPO,
    workflow: process.env.EXPORTER_GITHUB_WORKFLOW ?? EXPORTER_WORKFLOW,
    ref: process.env.EXPORTER_GITHUB_REF ?? 'main',
  };
}

/** URL de las runs del builder (para que la UI linkee a la run disparada). */
export function exporterRunsUrl(config: ExporterDispatchConfig): string {
  return `https://github.com/${config.owner}/${config.repo}/actions/workflows/${config.workflow}`;
}

/**
 * Dispara la Action `export-standalone.yml` del builder vía
 * `createWorkflowDispatch`. El manifest (config + tokens + i18n) ya vive en
 * Blob; aquí solo pasamos `slug`, `product` y la URL del manifest como inputs
 * del workflow.
 */
export async function dispatchExporterWorkflow(
  config: ExporterDispatchConfig,
  inputs: { slug: string; product: 'kiosk' | 'pwa'; manifestUrl: string },
): Promise<void> {
  const octokit = new Octokit({ auth: config.token });
  await octokit.actions.createWorkflowDispatch({
    owner: config.owner,
    repo: config.repo,
    workflow_id: config.workflow,
    ref: config.ref,
    inputs: {
      slug: inputs.slug,
      product: inputs.product,
      manifest_url: inputs.manifestUrl,
    },
  });
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
