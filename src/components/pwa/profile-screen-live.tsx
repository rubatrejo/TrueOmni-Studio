'use client';

import type { PwaProfileConfig } from '@/lib/config';

import { ProfileScreen } from './profile-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live de la pantalla principal de Profile. Lee el override de
 * `features.pwa.profile` (preview en vivo del Studio) y cae al valor del server
 * fuera del Studio. No toca `ProfileScreen`.
 */
export function ProfileScreenLive({
  profile,
  editHref,
}: {
  profile: PwaProfileConfig;
  editHref: string;
}) {
  const p = usePwaSection('profile', profile) ?? profile;
  return (
    <ProfileScreen
      editProfileLink={p.editProfileLink}
      user={p.user}
      favorites={p.favorites}
      upcomingEvents={p.upcomingEvents}
      editHref={editHref}
    />
  );
}
