import { ChangePasswordScreenLive } from '@/components/pwa/change-password-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  title: 'Change Your Password',
  body: 'This new password replaces the old one that has been set and you will not be able to use it anymore.',
  newPlaceholder: 'New Password',
  confirmPlaceholder: 'Confirm New Password',
  helper: 'Password must contain an upper & lowercase character, number, and special symbol.',
  establishCta: 'ESTABLISH NEW PASSWORD',
  error: {
    title: 'Something went wrong',
    body: 'There was an error performing this action. Please try again.',
    tryAgainCta: 'Try Again',
    closeCta: 'Close',
  },
  success: { title: 'Password Changed', doneCta: 'DONE' },
};

/** Change Password (`/pwa/profile/password`) — pantallas 3/4/5. */
export default async function PwaChangePasswordPage() {
  const config = await getConfig();
  const cp = config.features?.pwa?.profile?.changePassword ?? FALLBACK;

  return (
    <MobileCanvas>
      <ChangePasswordScreenLive changePassword={cp} doneHref="/pwa/profile/edit" />
    </MobileCanvas>
  );
}
