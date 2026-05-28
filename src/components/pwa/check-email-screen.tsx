'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';

import { S } from './mobile-layer';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface CheckEmailTexts {
  title: string;
  body: string;
  createAccountCta: string;
  tryAgainCta: string;
}

interface CheckEmailScreenProps {
  background: string;
  texts: CheckEmailTexts;
  /** Destino de "TRY AGAIN" (volver al paso 1). */
  forgotHref: string;
}

/**
 * Check Your Email — paso 2 del flujo Forgot Password
 * (`/pwa/forgot-password/check-email`). Confirmación tras pedir el reset.
 *
 * Render verbatim del XD (`2-Check Your Email.svg`, 375×812 → layer ×1.04). Mismo
 * patrón full-screen que el Login. "TRY AGAIN" vuelve al paso 1; "CREATE ACCOUNT"
 * queda no-op hasta que exista el Sign Up.
 */
export function CheckEmailScreen({ background, texts, forgotHref }: CheckEmailScreenProps) {
  const router = useRouter();

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${resolveAssetUrl(background)}")` }}
      />
      <div className="absolute inset-0 bg-black/80" />

      {/* Layer 375×812 con coords verbatim del XD, escalado al canvas 390×844. */}
      <div
        className="absolute left-0 top-0"
        style={{ width: 375, height: 812, transform: `scale(${S})`, transformOrigin: 'top left' }}
      >
        {/* Sobre abierto (verbatim del SVG, centrado ~187.5) */}
        <svg
          className="absolute text-white"
          style={{ left: 141, top: 167 }}
          width={92.169}
          height={92.169}
          viewBox="0 0 92.169 92.169"
          fill="currentColor"
          aria-hidden
        >
          <path d="M1.843,92.169A1.842,1.842,0,0,1,0,90.325V86.639C10.837,78.228,37.667,57.425,39.863,55.7a9.738,9.738,0,0,1,12.443,0c2.111,1.649,27.773,21.76,39.864,31.222v3.4a1.838,1.838,0,0,1-1.844,1.844ZM65.037,61,92.169,39.287V82.2C84.515,76.219,73.267,67.442,65.037,61ZM0,39.517,27.075,60.946C18.664,67.478,7.2,76.385,0,81.973ZM55.417,53.458c-.389-.3-.713-.518-.864-.634a14.075,14.075,0,0,0-8.238-3.054h18.2a1.844,1.844,0,0,1,0,3.687Zm-27.766,0a1.844,1.844,0,0,1,0-3.687h18.2a14.073,14.073,0,0,0-8.238,3.054c-.158.122-.475.331-.864.634ZM.749,35.37C3.146,33.245,34.88,5.127,37.5,2.938A13.178,13.178,0,0,1,46.084,0a13.181,13.181,0,0,1,8.583,2.938C57.5,5.307,87.956,32.28,91.305,35.255L77.422,46.373V33.18a1.842,1.842,0,0,0-1.843-1.843H16.591a1.847,1.847,0,0,0-1.843,1.843V46.488Zm26.9,8.871a1.844,1.844,0,0,1,0-3.687H64.518a1.844,1.844,0,0,1,0,3.687Z" />
        </svg>

        {/* Título */}
        <div
          className="absolute text-center text-white"
          style={{ left: 0, top: 299, width: 375, fontSize: 24, lineHeight: 1, ...OPEN_SANS }}
        >
          {texts.title}
        </div>

        {/* Body (2 líneas centradas) */}
        <div
          className="absolute text-center text-white"
          style={{ left: 45, top: 348, width: 285, fontSize: 14, lineHeight: '19px', ...OPEN_SANS }}
        >
          {texts.body}
        </div>

        {/* CREATE ACCOUNT → signup */}
        <button
          type="button"
          onClick={() => router.push('/pwa/create-account')}
          className="absolute flex items-center justify-center rounded-[2px] bg-[hsl(var(--pwa-primary))] font-bold uppercase text-white"
          style={{ left: 23, top: 451, width: 328, height: 46, fontSize: 14, letterSpacing: 0.5 }}
        >
          {texts.createAccountCta}
        </button>

        {/* TRY AGAIN (vuelve al paso 1) */}
        <button
          type="button"
          onClick={() => router.push(forgotHref)}
          className="absolute flex items-center justify-center rounded-[3px] border border-white font-bold uppercase text-white"
          style={{ left: 23, top: 516, width: 328, height: 46, fontSize: 14, letterSpacing: 0.5 }}
        >
          {texts.tryAgainCta}
        </button>
      </div>
    </div>
  );
}
