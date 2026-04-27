'use client';

export interface AiItineraryFloatingCardProps {
  label: string;
  onTap: () => void;
}

/**
 * Card flotante "AI ITINERARY" sobre el mapa (top-right). Tap → abre el
 * AiPopup. Background gradient azul oscuro → azul claro con icono y texto
 * blancos.
 */
export function AiItineraryFloatingCard({ label, onTap }: AiItineraryFloatingCardProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={label}
      className="absolute z-30 flex items-center rounded-md shadow-lg transition hover:opacity-95"
      style={{
        right: 24,
        top: 360,
        height: 68,
        gap: 11,
        paddingLeft: 21,
        paddingRight: 21,
        background:
          'linear-gradient(135deg, hsl(var(--itinerary-toolbar-bg)) 0%, hsl(var(--itinerary-tab-active)) 100%)',
        color: 'white',
      }}
    >
      <svg width="29" height="29" viewBox="0 0 24 24" aria-hidden="true" fill="white">
        <path d="M12 2l1.8 5.4L19 9.2 13.8 11 12 16.4 10.2 11 5 9.2l5.2-1.8L12 2zM5 16l.9 2.7L8.6 20l-2.7.9L5 23.5l-.9-2.7L1.5 20l2.7-.9L5 16z" />
      </svg>
      <span className="text-[17px] font-bold tracking-wider text-white">{label}</span>
    </button>
  );
}
