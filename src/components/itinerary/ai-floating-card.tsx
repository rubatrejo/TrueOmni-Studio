'use client';

export interface AiItineraryFloatingCardProps {
  label: string;
  onTap: () => void;
}

/**
 * Card flotante "AI ITINERARY" sobre el mapa (top-right). Tap → abre el
 * AiPopup. Estilo translúcido con sparkle icon.
 */
export function AiItineraryFloatingCard({ label, onTap }: AiItineraryFloatingCardProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={label}
      className="absolute z-30 flex items-center gap-2 rounded-md bg-white/95 px-4 py-2 shadow-lg transition hover:opacity-95"
      style={{ right: 18, top: 348, height: 52 }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2l1.8 5.4L19 9.2 13.8 11 12 16.4 10.2 11 5 9.2l5.2-1.8L12 2zM5 16l.9 2.7L8.6 20l-2.7.9L5 23.5l-.9-2.7L1.5 20l2.7-.9L5 16z"
          fill="hsl(var(--primary))"
        />
      </svg>
      <span
        className="text-[13px] font-bold tracking-wider"
        style={{ color: 'hsl(var(--primary))' }}
      >
        {label}
      </span>
    </button>
  );
}
