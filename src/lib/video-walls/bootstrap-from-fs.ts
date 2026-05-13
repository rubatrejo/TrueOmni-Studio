import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { kvVideoWall } from './kv-store';
import { VideoWallConfigSchema, type VideoWallClientFile } from './schema';

/**
 * Bootstrap del producto Video Walls desde el filesystem hacia el KV.
 *
 * Clona los walls declarados en `clients-walls/<sourceSlug>/client.json`
 * (`walls: string[]`) leyendo cada `walls/<wallSlug>/wall.json` y
 * persistiéndolo en KV bajo `videowall:wall:<targetSlug>:<wallSlug>`.
 *
 * El llamador es responsable de persistir el `VideoWallClientFile` con
 * `walls: [...]` ya poblado. Este helper solo escribe los wall.json
 * individuales — devuelve el array de slugs efectivamente clonados para
 * que el caller los meta en `clientFile.walls`.
 *
 * Idempotente por wall: si `kvVideoWall.get(target, wallSlug)` ya existe,
 * lo respeta y no sobrescribe. Esto preserva ediciones del operador y
 * evita data-loss en re-runs.
 *
 * Patrón paralelo al `bootstrapStudioFromFs` del kiosk pero a nivel
 * múltiple-wall en lugar de un único config.
 */
const VIDEO_WALL_ROOT = (): string => path.join(process.cwd(), 'clients-walls');

async function readJson(absPath: string): Promise<unknown> {
  const raw = await readFile(absPath, 'utf-8');
  return JSON.parse(raw) as unknown;
}

/**
 * Clona walls declarados en el filesystem del cliente fuente hacia el KV
 * del cliente destino.
 *
 * @param sourceSlug — slug del cliente fs origen (típicamente `'default'`).
 * @param targetSlug — slug del cliente destino (el cliente nuevo).
 * @returns array de wallSlugs clonados con éxito. Vacío si no había walls
 *   declarados o el fs no existe.
 */
export async function cloneVideoWallsFromFs(
  sourceSlug: string,
  targetSlug: string,
): Promise<string[]> {
  const root = VIDEO_WALL_ROOT();
  const clientJsonPath = path.join(root, sourceSlug, 'client.json');

  let declared: string[] = [];
  try {
    const raw = (await readJson(clientJsonPath)) as { walls?: unknown };
    if (Array.isArray(raw?.walls)) {
      declared = raw.walls.filter((w): w is string => typeof w === 'string' && w.length > 0);
    }
  } catch {
    // No source client.json — nada que clonar.
    return [];
  }

  const cloned: string[] = [];
  for (const wallSlug of declared) {
    const wallPath = path.join(root, sourceSlug, 'walls', wallSlug, 'wall.json');
    let raw: unknown;
    try {
      raw = await readJson(wallPath);
    } catch {
      // eslint-disable-next-line no-console
      console.warn(
        `[video-walls:bootstrap] wall "${wallSlug}" declared in ${sourceSlug}/client.json but ${wallPath} not readable; skipping.`,
      );
      continue;
    }

    const parsed = VideoWallConfigSchema.safeParse(raw);
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.warn(
        `[video-walls:bootstrap] wall "${wallSlug}" failed schema validation; skipping.`,
        parsed.error.issues,
      );
      continue;
    }

    // Idempotencia: respeta walls ya existentes en KV (preserva ediciones).
    const existing = await kvVideoWall.get(targetSlug, wallSlug).catch(() => null);
    if (existing) {
      cloned.push(wallSlug);
      continue;
    }

    await kvVideoWall.set(targetSlug, wallSlug, parsed.data);
    cloned.push(wallSlug);
  }

  return cloned;
}

/**
 * Aplica el array de walls clonados al `VideoWallClientFile` mutándolo
 * in-place. Helper para que activate/POST no dupliquen la lógica de
 * "spread walls + dedupe" entre los dos sites.
 *
 * Devuelve el mismo objeto para encadenar.
 */
export function applyClonedWalls(
  clientFile: VideoWallClientFile,
  wallSlugs: readonly string[],
): VideoWallClientFile {
  const dedup = Array.from(new Set([...clientFile.walls, ...wallSlugs]));
  clientFile.walls = dedup;
  return clientFile;
}
