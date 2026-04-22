'use client';

interface Props {
  onTap: () => void;
  ariaLabel: string;
}

/**
 * Capa oscura absoluta inset-0 dentro del KioskCanvas (contenido al frame
 * gracias al transform:scale del canvas — no escapa al viewport).
 * Tap dispara onTap; el padre decide si hay confirm-exit.
 */
export function SurveyBackdrop({ onTap, ariaLabel }: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onTap}
      className="absolute inset-0 cursor-default"
      style={{
        backgroundColor: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(6px)',
      }}
    />
  );
}
