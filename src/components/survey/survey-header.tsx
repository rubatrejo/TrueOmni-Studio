'use client';

interface Props {
  onClose: () => void;
  closeAriaLabel: string;
}

/**
 * X de cierre del survey. Mismo patrón visual que `ListingDetail` y los demás
 * popups del kiosk (círculo outline blanco 70×70 con X stroke blanco).
 * Se coloca absolute top-right del card.
 */
export function SurveyHeader({ onClose, closeAriaLabel }: Props) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={closeAriaLabel}
      className="absolute z-10 flex items-center justify-center rounded-full text-primary-foreground transition hover:bg-primary-foreground/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      style={{ top: '48px', right: '48px', width: '70px', height: '70px' }}
    >
      <svg width="42" height="42" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
