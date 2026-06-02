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
  /**
   * Escala del contenido del modal (1 = default, intacto para login/create-account).
   * El survey lo invoca con 0.85 para un popup ~15% más compacto.
   */
  scale?: number;
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
  scale = 1,
}: PwaAlertModalProps) {
  useEscapeToClose(open, onClose);
  if (!open) return null;

  // Dimensiones base (scale 1 = exactamente el modal original de login/create-account);
  // el survey pasa scale 0.85 → contenido ~15% más pequeño. Inline para poder escalar.
  const s = (n: number) => Math.round(n * scale);
  const d = {
    maxW: s(300),
    pad: s(24),
    badge: s(48),
    badgeMb: s(16),
    icon: s(26),
    title: s(18),
    titleMb: s(8),
    body: s(14),
    bodyLh: s(20),
    bodyMb: s(20),
    btnH: s(44),
    btnFs: s(14),
    secMt: s(12),
    secFs: s(14),
  };

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
      <div
        className="relative w-full rounded-2xl bg-background text-center shadow-xl"
        style={{ maxWidth: d.maxW, padding: d.pad }}
      >
        {/* Badge de alerta, tokenizado a pwa-primary */}
        <div
          className="mx-auto flex items-center justify-center rounded-full"
          style={{
            width: d.badge,
            height: d.badge,
            marginBottom: d.badgeMb,
            backgroundColor: 'hsl(var(--pwa-primary) / 0.12)',
            color: 'hsl(var(--pwa-primary))',
          }}
        >
          <svg
            width={d.icon}
            height={d.icon}
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
          className="font-bold text-foreground"
          style={{ fontSize: d.title, marginBottom: d.titleMb, ...OPEN_SANS }}
        >
          {title}
        </h2>
        <p
          className="text-foreground/70"
          style={{
            fontSize: d.body,
            lineHeight: `${d.bodyLh}px`,
            marginBottom: d.bodyMb,
            ...OPEN_SANS,
          }}
        >
          {body}
        </p>

        <button
          type="button"
          onClick={onPrimary ?? onClose}
          className="flex w-full items-center justify-center rounded-lg bg-[hsl(var(--pwa-primary))] font-bold uppercase text-white"
          style={{ height: d.btnH, fontSize: d.btnFs, letterSpacing: 0.5 }}
        >
          {primaryCta}
        </button>
        {secondaryCta ? (
          <button
            type="button"
            onClick={onSecondary}
            className="font-semibold text-[hsl(var(--pwa-primary))] underline"
            style={{ fontSize: d.secFs, marginTop: d.secMt, ...OPEN_SANS }}
          >
            {secondaryCta}
          </button>
        ) : null}
      </div>
    </div>
  );
}
