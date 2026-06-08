import { ConnectWithUsScreenLive } from '@/components/pwa/connect-with-us-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/** Fallback de coords si el cliente no las define (NY). */
const FALLBACK_COORDS = { lat: 40.7128, lng: -74.006 };

/**
 * Connect With Us de la PWA (`/pwa/connect-with-us`), abierta desde el More.
 * Contenido desde `config.features.pwa.connectWithUs`; la interpolación de
 * `{client_name}`/`{city}`/`{year}`/`{close}` se hace aquí (server) para evitar
 * mismatch de hidratación con `new Date()`.
 */
export default async function PwaConnectWithUsPage() {
  const config = await getConfig();
  const c = config.features?.pwa?.connectWithUs;
  const clientName = config.client.nombre;
  const coords = config.client.coords ?? FALLBACK_COORDS;
  const city = c?.city || clientName;
  const year = new Date().getFullYear();

  const interpolate = (s: string) =>
    s
      .replace(/\{client_name\}/g, clientName)
      .replace(/\{city\}/g, city)
      .replace(/\{year\}/g, String(year));

  const statusText = c?.hours
    ? c.hours.statusTemplate.replace(/\{close\}/g, c.hours.todayClose ?? '')
    : undefined;

  return (
    <MobileCanvas>
      <ConnectWithUsScreenLive
        config={c}
        title={c?.title ?? 'Connect With Us'}
        orgName={c?.orgName || clientName}
        social={c?.social}
        phone={c?.phone}
        website={c?.website}
        actions={c?.actions ?? { call: 'Call', website: 'Website', directions: 'Directions' }}
        address={c?.address}
        statusText={statusText}
        modalTitle={c?.hours?.modalTitle ?? 'Hours'}
        schedule={c?.hours?.schedule ?? []}
        copyright={c?.copyright ? interpolate(c.copyright) : undefined}
        coords={coords}
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </MobileCanvas>
  );
}
