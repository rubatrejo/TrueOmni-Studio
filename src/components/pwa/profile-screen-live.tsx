'use client';

import type { PwaProfileConfig } from '@/lib/config';

import { useDevice } from './device-context';
import { ProfileScreen } from './profile-screen';
import { ProfileScreenTablet } from './profile-screen-tablet';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live de la pantalla principal de Profile. Lee el override de
 * `features.pwa.profile` (preview en vivo del Studio) y cae al valor del server
 * fuera del Studio. Elige la variante por `useDevice()`: tablet → layout
 * full-width; phone → pixel-perfect (intacto). No toca `ProfileScreen`.
 */
export function ProfileScreenLive({
  profile,
  editHref,
}: {
  profile: PwaProfileConfig;
  editHref: string;
}) {
  const { isTablet } = useDevice();
  const p = usePwaSection('profile', profile) ?? profile;
  const Variant = isTablet ? ProfileScreenTablet : ProfileScreen;
  return (
    <Variant
      editProfileLink={p.editProfileLink}
      user={p.user}
      favorites={p.favorites}
      upcomingEvents={p.upcomingEvents}
      editHref={editHref}
    />
  );
}
