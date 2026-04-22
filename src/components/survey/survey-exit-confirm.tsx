'use client';

interface Props {
  title: string;
  message: string;
  cancelLabel: string;
  exitLabel: string;
  onCancel: () => void;
  onExit: () => void;
}

/**
 * Modal de confirmación anidado. Card blanca elevada con sombra fuerte.
 * Consistente con el tratamiento de los otros modales del kiosk.
 */
export function SurveyExitConfirm({
  title,
  message,
  cancelLabel,
  exitLabel,
  onCancel,
  onExit,
}: Props) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      />
      <div
        className="survey-card-anim relative flex flex-col"
        style={{
          width: '620px',
          borderRadius: '24px',
          paddingTop: '44px',
          paddingBottom: '40px',
          paddingLeft: '52px',
          paddingRight: '52px',
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px hsl(var(--foreground) / 0.08)',
          gap: '28px',
        }}
      >
        <h3
          className="text-center font-display font-bold"
          style={{ fontSize: '34px', lineHeight: 1.15, letterSpacing: '-0.015em' }}
        >
          {title}
        </h3>
        <p
          className="text-center font-sans"
          style={{ fontSize: '18px', lineHeight: 1.5, opacity: 0.72 }}
        >
          {message}
        </p>
        <div className="mt-2 flex items-center justify-center" style={{ gap: '14px' }}>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border-2 font-display font-semibold uppercase tracking-[0.06em] transition hover:bg-foreground/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-foreground/20"
            style={{
              borderColor: 'hsl(var(--foreground) / 0.25)',
              color: 'hsl(var(--foreground))',
              height: '56px',
              paddingLeft: '28px',
              paddingRight: '28px',
              fontSize: '16px',
              minWidth: '160px',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center justify-center rounded-full font-display font-bold uppercase tracking-[0.06em] transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-destructive/40"
            style={{
              backgroundColor: 'hsl(var(--destructive))',
              color: 'hsl(var(--destructive-foreground))',
              height: '56px',
              paddingLeft: '28px',
              paddingRight: '28px',
              fontSize: '16px',
              minWidth: '160px',
              boxShadow: '0 10px 24px -6px hsl(var(--destructive) / 0.5)',
            }}
          >
            {exitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
