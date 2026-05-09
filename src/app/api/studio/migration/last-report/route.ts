import { NextResponse } from 'next/server';

import { getLastMigrationReport } from '@/lib/studio/auto-migrate-clients';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `GET /api/studio/migration/last-report` — devuelve el último report del
 * auto-migrate cacheado in-memory. Hallazgo S-43 del audit panorámico v2:
 * el `MigrationReport` se calculaba al primer GET /api/studio/clients
 * pero solo se logueaba server-side. Ahora /studio/diagnostics lo lee
 * desde aquí y lo presenta al operador.
 */
export async function GET() {
  const data = getLastMigrationReport();
  return NextResponse.json(data);
}
