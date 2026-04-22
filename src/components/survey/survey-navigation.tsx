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
 * Footer del card: BACK (outline) izquierda + NEXT o SEND (fill white) derecha.
 * BACK invisible si no hay onBack (paso 0). Disabled = opacity 40%.
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
    <div className="mt-12 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="inline-flex items-center justify-center rounded-full border-2 border-primary-foreground/80 px-10 py-4 font-display font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary-foreground/10 disabled:cursor-not-allowed disabled:opacity-0"
        style={{ fontSize: '22px', minWidth: '180px' }}
      >
        ← {backLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex items-center justify-center rounded-full bg-primary-foreground font-display font-bold uppercase tracking-wide text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          fontSize: '22px',
          paddingLeft: '40px',
          paddingRight: '40px',
          paddingTop: '18px',
          paddingBottom: '18px',
          minWidth: isLastStep ? '260px' : '180px',
        }}
      >
        {nextLabel} {isLastStep ? '' : '→'}
      </button>
    </div>
  );
}
