import { NextResponse } from 'next/server';

import { computeFsTemplateHash } from '@/lib/studio/bootstrap-from-fs';
import { kv, kvKeys } from '@/lib/studio/kv';

/**
 * `GET /api/studio/diag/template-status`
 *
 * Devuelve para cada kiosk: el hash actual del template FS, el hash que tenía
 * cuando se bootstrappeó por última vez en KV, y un flag `drift`. Hallazgo
 * #27 del audit — antes el operador tenía que ejecutar manualmente el
 * endpoint de resync; ahora Diagnostics puede mostrar un widget "1 kiosk has
 * FS template drift available" automáticamente.
 *
 * Hashes son SHA-256 truncado a 16 chars (ver `computeFsTemplateHash`).
 */
export async function GET() {
  try {
    const slugs = await kv.smembers(kvKeys.clientsList);
    const status = await Promise.all(
      slugs.map(async (slug) => {
        const [fsHash, kvHash] = await Promise.all([
          computeFsTemplateHash(slug),
          kv.get<string>(kvKeys.cfgFsHash(slug)),
        ]);
        return {
          slug,
          fsHash: fsHash ?? null,
          kvHash: kvHash ?? null,
          // drift = el FS tiene un template (no es un slug-only client) Y el
          // kvHash registrado difiere del fsHash actual. Si nunca se
          // registró kvHash (kiosk pre-#27), drift queda `false` para no
          // forzar resync masivos a kioscos legacy.
          drift: Boolean(fsHash && kvHash && fsHash !== kvHash),
        };
      }),
    );
    const driftCount = status.filter((s) => s.drift).length;
    return NextResponse.json({ kiosks: status, driftCount });
  } catch (error) {
    console.error('[api/studio/diag/template-status GET]', error);
    return NextResponse.json({ error: 'Failed to compute template status' }, { status: 500 });
  }
}
