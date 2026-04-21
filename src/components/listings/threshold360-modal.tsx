'use client';

import { useEscapeToClose } from './use-escape-to-close';

/**
 * Threshold 360 modal con iframe. Sandbox `allow-scripts` + `allow-same-origin`
 * para que el tour cargue; sin `allow-top-navigation` ni `allow-forms` para
 * reducir blast radius de un iframe third-party.
 */
export function Threshold360Modal({
  open,
  url,
  title,
  onClose,
}: {
  open: boolean;
  url: string | undefined;
  title: string;
  onClose: () => void;
}) {
  useEscapeToClose(open, onClose);

  if (!open || !url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Tour 360° de ${title}`}
      className="absolute inset-0"
      style={{ zIndex: 40 }}
    >
      <button
        type="button"
        aria-label="Cerrar tour 360"
        onClick={onClose}
        className="absolute inset-0 cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        tabIndex={-1}
      />

      <div
        className="absolute overflow-hidden bg-black"
        style={{
          left: '40px',
          top: '120px',
          width: '1000px',
          height: '1680px',
          borderRadius: '10px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <iframe
          src={url}
          title={`Tour 360 de ${title}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 0 }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#fff',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
