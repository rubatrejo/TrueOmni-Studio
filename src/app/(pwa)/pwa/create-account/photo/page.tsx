import { CreateAccountPhotoScreenLive } from '@/components/pwa/create-account-photo-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  title: 'Upload Picture',
  subtitle: 'Take a minute to upload a profile picture',
  addPhoto: 'Add photo',
  fullNameFallback: 'FULL NAME',
  skipCta: 'SKIP AND FINISH',
  saveCta: 'SAVE AND FINISH',
  cancelCta: 'CANCEL',
  takePhoto: 'Take Photo',
  chooseGallery: 'Choose From Gallery',
  cancelSheet: 'Cancel',
  sizeHint: 'Your image has to weigh less than 5MB to upload it correctly.',
};

/**
 * Upload Picture (`/pwa/create-account/photo`) — pasos 2-4 del Create Account.
 * El nombre se recibe por query param `name` (lo manda SIGN UP); fallback en config.
 */
export default async function PwaCreateAccountPhotoPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string | string[] }>;
}) {
  const config = await getConfig();
  const pwa = config.features?.pwa;
  const photo = pwa?.createAccount?.photo ?? FALLBACK;
  const background =
    pwa?.login?.background ?? pwa?.welcome?.background ?? 'assets/pwa/welcome-bg.jpg';

  const sp = await searchParams;
  const rawName = Array.isArray(sp?.name) ? sp.name[0] : sp?.name;
  const fullName = rawName && rawName.trim() ? rawName.trim() : photo.fullNameFallback;

  return (
    <MobileCanvas>
      <CreateAccountPhotoScreenLive
        config={pwa?.createAccount}
        background={background}
        fullName={fullName}
        texts={photo}
        dashboardHref="/pwa/profile"
      />
    </MobileCanvas>
  );
}
