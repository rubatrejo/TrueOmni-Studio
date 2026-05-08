import { NextResponse } from 'next/server';

import { autoMigrateClients } from '@/lib/studio/auto-migrate-clients';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de diagnóstico temporal — corre la auto-migración manualmente y
 * devuelve el report. Útil durante Fase 2 para validar idempotencia con los
 * clientes existentes (default, demo-cliente-a, discover-dekalb,
 * san-francisco) antes de cablear el migrador al `/studio` dashboard
 * (Fase 3).
 *
 * Uso:
 *   curl http://localhost:3000/api/studio/diag/migrate-clients
 *
 * Idempotente: re-correrlo solo afecta slugs que NO tienen manifest aún.
 *
 * Eliminar este endpoint cuando el flujo unified ya esté estable en
 * producción (post-Fase 6).
 */
export async function GET() {
  const report = await autoMigrateClients();
  return NextResponse.json(report);
}
