'use client';

export interface LeaveAiWarningPopupProps {
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Warning popup estilo Photo Booth (`exit_*` tokens) usado por el botón
 * "Start Over" del Final Result. Confirma que el usuario quiere descartar
 * el itinerario AI generado y volver al popup AI.
 */
export function LeaveAiWarningPopup(props: LeaveAiWarningPopupProps) {
  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/55"
        onPointerDown={props.onCancel}
        aria-hidden="true"
      />
      <div className="relative flex w-[640px] flex-col items-center rounded-[24px] bg-white px-12 py-10 shadow-2xl">
        <h2
          className="text-center text-[34px] font-bold leading-tight"
          style={{ color: 'hsl(var(--primary))', whiteSpace: 'pre-line' }}
        >
          {props.title}
        </h2>
        <p className="mt-5 text-center text-[16px] leading-relaxed text-zinc-700">
          {props.body}
        </p>
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={props.onCancel}
            className="flex h-[56px] items-center justify-center rounded-full border-2 px-10 text-[18px] font-semibold transition"
            style={{
              borderColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary))',
            }}
          >
            {props.cancelLabel}
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            className="flex h-[56px] items-center justify-center rounded-full px-10 text-[18px] font-semibold text-white shadow-md transition"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
