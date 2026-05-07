import { collectSignageDiagnostics } from '@/lib/signage/diagnostics';

import { DiagnosticsView } from './_components/DiagnosticsView';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Diagnostics · Digital Displays · TrueOmni Studio' };

/**
 * `/studio/digital-displays/diagnostics` — Server component que recopila
 * info del sistema signage y la pasa al `<DiagnosticsView>`.
 */
export default async function DiagnosticsPage() {
  const data = await collectSignageDiagnostics();
  return <DiagnosticsView data={data} />;
}
