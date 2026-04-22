'use client';

interface Props {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  backLabel: string;
  nextDisabled?: boolean;
  isLastStep: boolean;
}

/**
 * Footer del card. BACK (outline) izquierda, NEXT/SEND (fill white) derecha.
 * Aireado, shadow glow en el CTA primario, transiciones cinematográficas.
 */
export function SurveyNavigation({
  onBack,
  onNext,
  nextLabel,
  backLabel,
  nextDisabled = false,
  isLastStep,
}: Props) {
  return (
    <div className="flex items-center justify-between" style={{ gap: '24px' }}>
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="group inline-flex items-center justify-center rounded-full border-2 font-display font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-foreground/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-0"
        style={{
          borderColor: 'hsl(var(--primary-foreground) / 0.7)',
          height: '72px',
          paddingLeft: '36px',
          paddingRight: '40px',
          fontSize: '18px',
          minWidth: '180px',
          gap: '12px',
        }}
      >
        <span className="transition-transform duration-200 group-hover:-translate-x-1" aria-hidden>
          ←
        </span>
        {backLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="group inline-flex items-center justify-center rounded-full bg-primary-foreground font-display font-bold uppercase tracking-[0.08em] text-primary transition-all duration-200 ease-out hover:scale-[1.02] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        style={{
          height: '72px',
          paddingLeft: '40px',
          paddingRight: '40px',
          fontSize: '18px',
          minWidth: isLastStep ? '280px' : '200px',
          gap: '14px',
          boxShadow:
            '0 12px 32px -8px hsl(var(--primary-foreground) / 0.5), 0 0 0 1px hsl(var(--primary-foreground) / 0.2)',
        }}
      >
        {nextLabel}
        {!isLastStep ? (
          <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
            →
          </span>
        ) : (
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}
