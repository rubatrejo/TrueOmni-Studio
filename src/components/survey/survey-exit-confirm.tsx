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
 * Modal de confirmación anidado sobre el SurveyOverlay. z-index ligeramente
 * mayor (absolute inset-0 dentro del overlay). Backdrop propio más oscuro.
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
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      />
      <div
        className="relative bg-background text-foreground shadow-xl"
        style={{
          width: '640px',
          borderRadius: '20px',
          paddingTop: '40px',
          paddingBottom: '40px',
          paddingLeft: '48px',
          paddingRight: '48px',
        }}
      >
        <h3 className="mb-3 text-center font-display font-bold" style={{ fontSize: '32px' }}>
          {title}
        </h3>
        <p className="mb-8 text-center font-sans" style={{ fontSize: '20px', opacity: 0.8 }}>
          {message}
        </p>
        <div className="flex items-center justify-center" style={{ gap: '16px' }}>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border-2 border-foreground/30 px-8 py-3 font-display font-bold uppercase text-foreground transition hover:bg-foreground/5"
            style={{ fontSize: '18px', minWidth: '160px' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center justify-center rounded-full bg-destructive px-8 py-3 font-display font-bold uppercase text-destructive-foreground transition hover:opacity-90"
            style={{ fontSize: '18px', minWidth: '160px' }}
          >
            {exitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
