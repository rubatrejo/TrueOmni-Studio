import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { SocialWallScreen } from '@/components/pwa/social-wall/social-wall-screen';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Social Wall (`/pwa/social-wall`) — muro masonry réplica mobile del kiosk. Textos
 * desde `config.features.pwa.socialWall`; la data (hashtag, handles, highlights,
 * posts) se reutiliza del kiosk (`home.modules['social-wall']`). Fallback si falta.
 */
export default async function PwaSocialWallPage() {
  const config = await getConfig();
  const texts = config.features?.pwa?.socialWall;
  const mod = config.features?.home?.modules?.['social-wall'];

  if (!texts || !mod || mod.kind !== 'social-wall') {
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
      <SocialWallScreen texts={texts} mod={mod} />
    </MobileCanvas>
  );
}
