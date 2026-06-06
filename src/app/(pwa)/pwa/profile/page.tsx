import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { ProfileScreenLive } from '@/components/pwa/profile-screen-live';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Profile (`/pwa/profile`) — pantalla 1, destino del Save/Skip del signup, del icono
 * de perfil del header y del item "My Profile" del More. Datos mock desde
 * `config.features.pwa.profile`.
 */
export default async function PwaProfilePage() {
  const config = await getConfig();
  const p = config.features?.pwa?.profile;

  if (!p) {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center text-foreground">
          {config.client.nombre}
        </div>
      </MobileCanvas>
    );
  }

  return (
    <MobileCanvas>
      <ProfileScreenLive profile={p} editHref="/pwa/profile/edit" />
    </MobileCanvas>
  );
}
