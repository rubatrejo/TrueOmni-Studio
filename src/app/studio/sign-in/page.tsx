'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

/** GitHub mark inline — `lucide-react@1.8` no exporta Github. */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.48 2 2 6.58 2 12.25c0 4.54 2.87 8.39 6.84 9.75.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.36-3.37-1.36-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.13-4.55-5.04 0-1.11.39-2.02 1.03-2.74-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.04.8-.23 1.65-.34 2.5-.34.85 0 1.7.11 2.5.34 1.91-1.31 2.75-1.04 2.75-1.04.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.74 0 3.92-2.34 4.78-4.57 5.03.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.59.69.49C19.14 20.63 22 16.79 22 12.25 22 6.58 17.52 2 12 2z"
      />
    </svg>
  );
}

/**
 * Sign-in page custom del Studio.
 *
 * Full-bleed image background (lobby con kioscos TrueOmni en uso) + gradient
 * overlay del lado izquierdo para que el copy sea legible. Identidad fija:
 * NO respeta el theme dark/light del Studio porque la paleta (texto blanco
 * sobre overlay negro, botón blanco con texto oscuro) viene marcada por la
 * imagen.
 *
 * NextAuth v5 redirige aquí cuando el middleware encuentra una request a
 * `/studio/*` o `/api/studio/*` sin sesión. Tras aprobar GitHub OAuth, vuelve
 * a `callbackUrl` (default `/studio`).
 *
 * Allowlist enforcement: si el email del operador NO está en
 * `STUDIO_ADMIN_EMAILS`, el `signIn` callback de auth.ts retorna false y
 * NextAuth redirige aquí con `?error=AccessDenied`. Render del banner inline.
 */
export default function StudioSignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/studio';
  const error = searchParams?.get('error') ?? null;

  const [isPending, setIsPending] = useState(false);

  const handleSignIn = async () => {
    setIsPending(true);
    try {
      await signIn('github', { callbackUrl });
      // signIn redirige; setIsPending(false) no es necesario en éxito.
    } catch {
      // Solo se llega aquí si signIn lanza antes del redirect — improbable.
      setIsPending(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Background image full viewport */}
      <Image
        src="/sign-in-bg.jpg"
        alt=""
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover"
      />

      {/* Gradient overlay izquierdo: oscuro a transparente */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0) 65%)',
        }}
      />

      {/* Content stack — lado izquierdo */}
      <div className="relative flex h-full flex-col justify-between px-20 py-16">
        <div>
          <TrueOmniLogo className="h-8 w-auto text-white" />
        </div>

        <div className="flex max-w-[640px] flex-col gap-7">
          <p
            className="font-display text-[14px] uppercase text-white/70"
            style={{ letterSpacing: '0.22em' }}
          >
            TrueOmni Studio
          </p>
          <h1 className="font-display text-[96px] font-bold leading-[1.02] text-white">
            Welcome back.
          </h1>
          <p className="max-w-[560px] font-sans text-[20px] leading-relaxed text-white/80">
            Sign in with GitHub to manage your kiosks, push branding updates and
            publish changes via Pull Request.
          </p>

          {error === 'AccessDenied' ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-3 text-[12.5px] text-white backdrop-blur-sm"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <span>
                This account isn&apos;t authorized for the Studio. Contact{' '}
                <a
                  href="mailto:ruben@trueomni.com"
                  className="font-medium underline decoration-white/40 underline-offset-2 hover:decoration-white"
                >
                  ruben@trueomni.com
                </a>{' '}
                if you think this is a mistake.
              </span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSignIn}
            disabled={isPending}
            className="inline-flex h-12 items-center justify-center gap-2.5 self-start rounded-lg bg-white px-6 text-[14px] font-semibold text-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to GitHub…
              </>
            ) : (
              <>
                <GithubIcon className="h-4 w-4" />
                Sign in with GitHub
              </>
            )}
          </button>
        </div>

        <div className="font-sans text-[12px] text-white/50">
          © 2026 TrueOmni · Kiosk Studio v0.1
        </div>
      </div>
    </div>
  );
}
