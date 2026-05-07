import {
  listSignageClients,
  listSignageDisplays,
  type SignageDisplayListEntry,
} from '@/lib/signage/config';

import { ClientsDashboard } from './_components/ClientsDashboard';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Digital Displays · TrueOmni Studio',
};

export interface SignageClientWithDisplays {
  slug: string;
  name: string;
  displaysCount: number;
  displays: SignageDisplayListEntry[];
}

/**
 * `/studio/digital-displays` — Único punto de entrada del editor signage (DSS0).
 *
 * Server component que carga los clients de `clients-signage/` (fs-only) +
 * los displays de cada uno en una sola pasada. La UI cliente expone preview
 * inline por display y un botón "Edit" disabled hasta DSS1+.
 *
 * Sin sub-URLs: cada signage client se gestiona directo desde esta página.
 */
export default async function DigitalDisplaysPage() {
  const clients = await listSignageClients();
  const clientsWithDisplays: SignageClientWithDisplays[] = await Promise.all(
    clients.map(async (c) => ({
      ...c,
      displays: await listSignageDisplays(c.slug),
    })),
  );
  return <ClientsDashboard clients={clientsWithDisplays} />;
}
