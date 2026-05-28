import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { SettingsScreen } from '@/components/pwa/settings-screen';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/** Settings (`/pwa/profile/settings`) — pantalla 6. */
export default async function PwaSettingsPage() {
  const config = await getConfig();
  const s = config.features?.pwa?.profile?.settings;
  return (
    <MobileCanvas>
      <SettingsScreen
        title={s?.title ?? 'Settings'}
        deleteRow={s?.deleteRow ?? 'Delete my Account'}
      />
    </MobileCanvas>
  );
}
