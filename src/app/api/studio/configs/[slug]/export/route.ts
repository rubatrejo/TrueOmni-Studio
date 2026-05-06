import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import type { KioskConfig } from '@/lib/studio/schema';

/**
 * `GET /api/studio/configs/[slug]/export`
 *
 * Devuelve el config completo del kiosk como JSON adjunto. El operador puede
 * guardarlo como backup o moverlo a otro entorno (dev → staging) usando el
 * endpoint de import.
 *
 * Hallazgo #25 del audit: hasta ahora solo había export por catálogo
 * (listings/events). Faltaba un export atómico del kiosk entero.
 */
type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (!cfg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const filename = `${slug}-config-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(cfg, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[api/studio/configs/[slug]/export GET]', error);
    return NextResponse.json({ error: 'Failed to export config' }, { status: 500 });
  }
}
