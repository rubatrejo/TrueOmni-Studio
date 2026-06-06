'use client';

import type { PwaEditProfileConfig } from '@/lib/config';

import { EditProfileScreen } from './edit-profile-screen';
import { usePwaSection } from './pwa-bridge-context';

type PhotoSheetTexts = {
  takePhoto: string;
  chooseGallery: string;
  cancelSheet: string;
  sizeHint: string;
};

/**
 * Wrapper live de Edit Profile. Re-deriva `editProfile` desde el override de
 * `features.pwa.profile` (preview en vivo del Studio) con el valor del server
 * como fallback. Los textos del photo sheet vienen de `createAccount.photo`
 * (resueltos en el server) y se pasan tal cual. No toca `EditProfileScreen`.
 */
export function EditProfileScreenLive({
  editProfile,
  photoSheetTexts,
}: {
  editProfile: PwaEditProfileConfig;
  photoSheetTexts: PhotoSheetTexts;
}) {
  const profile = usePwaSection('profile', undefined);
  const ep = profile?.editProfile ?? editProfile;
  return (
    <EditProfileScreen
      texts={{
        title: ep.title,
        editPhoto: ep.editPhoto,
        changePasswordCta: ep.changePasswordCta,
        saveCta: ep.saveCta,
        prefill: ep.prefill,
      }}
      photoSheetTexts={photoSheetTexts}
    />
  );
}
