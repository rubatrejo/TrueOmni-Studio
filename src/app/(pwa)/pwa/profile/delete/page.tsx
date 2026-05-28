import { DeleteAccountFlow } from '@/components/pwa/delete-account-flow';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  title: 'Delete Profile',
  surveyTitle: 'Survey',
  reason: {
    heading: 'Please, share with us the reason because you want to delete your account',
    options: [
      'Something was broken',
      'App Crashes',
      'I receive so many notifications',
      'I have a privacy concern',
      'Other',
    ],
    continueCta: 'CONTINUE',
  },
  other: {
    heading:
      "We are working on improve the experience, we'd be so grateful to be aware your feedback",
    placeholder: 'Your explanation is optional',
    continueCta: 'CONTINUE',
  },
  confirm: {
    heading: "It's advisable for you to request your data to be send by email",
    sendDataLabel: 'Yes, send my data to my email',
    passwordPlaceholder: 'Password*',
    warning:
      'You will permanently lose all your notifications and profile info. After this, there is no turning back',
    continueCta: 'CONTINUE',
  },
  survey: {
    question: 'Your country of residence is part of :',
    options: [
      'European countries',
      'Asian countries',
      'North American Countries',
      'South American Countries and Antilles',
      'Other',
    ],
    deleteCta: 'DELETE MY ACCOUNT',
  },
};

/** Delete Account (`/pwa/profile/delete`) — pantallas 7-10 (multi-step). */
export default async function PwaDeleteAccountPage() {
  const config = await getConfig();
  const d = config.features?.pwa?.profile?.delete ?? FALLBACK;
  return (
    <MobileCanvas>
      <DeleteAccountFlow texts={d} logoutHref="/pwa" />
    </MobileCanvas>
  );
}
