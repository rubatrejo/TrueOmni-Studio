'use client';

interface Props {
  logo?: string;
  onClose: () => void;
  closeAriaLabel: string;
}

/**
 * Header del card: logo centrado arriba (si existe) + X top-right.
 */
export function SurveyHeader({ logo, onClose, closeAriaLabel }: Props) {
  return (
    <div className="relative mb-8 flex items-center justify-center" style={{ height: '112px' }}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-full w-auto object-contain" />
      ) : null}
      <button
        type="button"
        aria-label={closeAriaLabel}
        onClick={onClose}
        className="absolute top-0 flex items-center justify-center rounded-full border-2 border-primary-foreground/80 text-primary-foreground transition hover:bg-primary-foreground/10"
        style={{ right: '0', width: '56px', height: '56px' }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
