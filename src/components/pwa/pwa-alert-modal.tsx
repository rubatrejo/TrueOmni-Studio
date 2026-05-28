'use client';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface PwaAlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  /** Botón primario (cierra por defecto si no hay onPrimary). */
  primaryCta: string;
  onPrimary?: () => void;
  /** Link secundario opcional (ej. "Create Account"). */
  secondaryCta?: string;
  onSecondary?: () => void;
}

/**
 * Modal compacto genérico de la PWA (estilo alert de app): badge + título + mensaje +
 * botón primario + link secundario opcional. Centrado, scrim, cierra con scrim/Escape.
 * Lo reusan el error de login y la validación del Create Account.
 */
export function PwaAlertModal({
  open,
  onClose,
  title,
  body,
  primaryCta,
  onPrimary,
  secondaryCta,
  onSecondary,
}: PwaAlertModalProps) {
  useEscapeToClose(open, onClose);
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-alert-title"
      className="absolute inset-0 z-30 flex items-center justify-center px-8"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 focus:outline-none"
        tabIndex={-1}
      />
      <div className="relative w-full max-w-[300px] rounded-2xl bg-background p-6 text-center shadow-xl">
        {/* Badge de alerta, tokenizado a pwa-primary */}
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'hsl(var(--pwa-primary) / 0.12)',
            color: 'hsl(var(--pwa-primary))',
          }}
        >
          <svg
            width={26}
            height={26}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <h2
          id="pwa-alert-title"
          className="mb-2 font-bold text-foreground"
          style={{ fontSize: 18, ...OPEN_SANS }}
        >
          {title}
        </h2>
        <p
          className="mb-5 text-foreground/70"
          style={{ fontSize: 14, lineHeight: '20px', ...OPEN_SANS }}
        >
          {body}
        </p>

        <button
          type="button"
          onClick={onPrimary ?? onClose}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-[hsl(var(--pwa-primary))] font-bold uppercase text-white"
          style={{ fontSize: 14, letterSpacing: 0.5 }}
        >
          {primaryCta}
        </button>
        {secondaryCta ? (
          <button
            type="button"
            onClick={onSecondary}
            className="mt-3 font-semibold text-[hsl(var(--pwa-primary))] underline"
            style={{ fontSize: 14, ...OPEN_SANS }}
          >
            {secondaryCta}
          </button>
        ) : null}
      </div>
    </div>
  );
}
