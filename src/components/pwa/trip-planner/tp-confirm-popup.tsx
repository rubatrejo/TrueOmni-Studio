'use client';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Popup de confirmación mobile (estilo `tp-ai-popup` / `leave-ai-warning` del kiosk):
 * overlay oscuro + tarjeta blanca centrada con título, cuerpo y dos botones
 * (cancelar outline + confirmar filled). Usado por My Plan para confirmar el
 * borrado de un stop o el "Clear all".
 */
export function TpConfirmPopup({
  title,
  body,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 px-8"
      role="dialog"
      aria-modal="true"
      style={OPEN_SANS}
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full max-w-[300px] rounded-[14px] bg-white px-6 pb-6 pt-7 text-center">
        <h2
          className="text-[19px] font-extrabold leading-tight"
          style={{ color: 'hsl(var(--brand-primary))', whiteSpace: 'pre-line' }}
        >
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-[250px] text-[13px] leading-relaxed text-foreground/65">
          {body}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border-2 py-2.5 text-[13px] font-bold uppercase transition-transform active:scale-[0.97]"
            style={{
              borderColor: 'hsl(var(--brand-primary))',
              color: 'hsl(var(--brand-primary))',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full py-2.5 text-[13px] font-bold uppercase text-white transition-transform active:scale-[0.97]"
            style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
