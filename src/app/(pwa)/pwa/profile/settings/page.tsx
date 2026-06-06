import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { SettingsScreenLive } from '@/components/pwa/settings-screen-live';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/** Settings (`/pwa/profile/settings`) — pantalla 6. */
export default async function PwaSettingsPage() {
  const config = await getConfig();
  const s = config.features?.pwa?.profile?.settings ?? {
    title: 'Settings',
    deleteRow: 'Delete my Account',
  };
  return (
    <MobileCanvas>
      <SettingsScreenLive settings={s} />
    </MobileCanvas>
  );
}
