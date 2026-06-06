import { EditProfileScreenLive } from '@/components/pwa/edit-profile-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const SHEET_FALLBACK = {
  takePhoto: 'Take Photo',
  chooseGallery: 'Choose From Gallery',
  cancelSheet: 'Cancel',
  sizeHint: 'Your image has to weigh less than 5MB to upload it correctly.',
};

/** Edit Profile (`/pwa/profile/edit`) — pantalla 2. */
export default async function PwaEditProfilePage() {
  const config = await getConfig();
  const pwa = config.features?.pwa;
  const e = pwa?.profile?.editProfile;
  const ca = pwa?.createAccount?.photo;

  if (!e) {
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
      <EditProfileScreenLive
        editProfile={e}
        photoSheetTexts={
          ca
            ? {
                takePhoto: ca.takePhoto,
                chooseGallery: ca.chooseGallery,
                cancelSheet: ca.cancelSheet,
                sizeHint: ca.sizeHint,
              }
            : SHEET_FALLBACK
        }
      />
    </MobileCanvas>
  );
}
