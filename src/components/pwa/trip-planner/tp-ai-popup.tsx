'use client';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/** Popup AI: dos caminos — AI Itinerary (sparkle/azul) y Top Suggestions (heart/olive). */
export function TpAiPopup({
  textos,
  clientName,
  onChoose,
  onClose,
}: {
  textos: Record<string, string>;
  clientName: string;
  onChoose: (path: 'ai' | 'top') => void;
  onClose: () => void;
}) {
  const fill = (s: string) => s.replaceAll('{client_name}', clientName);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      style={OPEN_SANS}
    >
      <div className="relative w-full rounded-[14px] bg-white px-6 pb-7 pt-7 text-center">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400"
        >
          <svg width={16} height={16} viewBox="0 0 16 16">
            <path
              d="M12.5 3.5l-9 9M3.5 3.5l9 9"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2 className="text-[22px] font-extrabold" style={{ color: 'hsl(var(--brand-secondary))' }}>
          {textos.itinerary_ai_popup_title ?? 'AI TRIP PLANNER'}
        </h2>
        <p
          className="mx-auto mt-2 max-w-[290px] text-[12px] leading-relaxed"
          style={{ color: 'hsl(var(--brand-secondary))' }}
        >
          {fill(textos.itinerary_ai_popup_subtitle ?? '')}
        </p>

        {/* AI ITINERARY */}
        <div className="mt-5 rounded-[12px] bg-gray-50 px-5 py-5">
          <div
            className="mx-auto flex h-[44px] w-[44px] items-center justify-center rounded-full"
            style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="white" aria-hidden>
              <path d="M12 2c.4 3 1.6 4.2 4.6 4.6C13.6 7 12.4 8.2 12 11.2 11.6 8.2 10.4 7 7.4 6.6 10.4 6.2 11.6 5 12 2z" />
            </svg>
          </div>
          <p
            className="mt-3 text-[16px] font-bold"
            style={{ color: 'hsl(var(--brand-secondary))' }}
          >
            {textos.itinerary_ai_card_ai_title ?? 'AI ITINERARY'}
          </p>
          <p
            className="mx-auto mt-1 max-w-[270px] text-[12px] leading-relaxed"
            style={{ color: 'hsl(var(--brand-secondary))' }}
          >
            {fill(textos.itinerary_ai_card_ai_body ?? '')}
          </p>
          <button
            type="button"
            onClick={() => onChoose('ai')}
            className="mt-4 w-full rounded-full py-3 text-[14px] font-bold text-white"
            style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
          >
            {textos.itinerary_ai_card_ai_cta ?? 'Start'}
          </button>
        </div>

        {/* TOP SUGGESTIONS */}
        <div className="mt-4 rounded-[12px] bg-gray-50 px-5 py-5">
          <div
            className="mx-auto flex h-[44px] w-[44px] items-center justify-center rounded-full"
            style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="white" aria-hidden>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p
            className="mt-3 text-[16px] font-bold"
            style={{ color: 'hsl(var(--brand-secondary))' }}
          >
            {textos.itinerary_ai_card_top_title ?? 'TOP SUGGESTIONS'}
          </p>
          <p
            className="mx-auto mt-1 max-w-[270px] text-[12px] leading-relaxed"
            style={{ color: 'hsl(var(--brand-secondary))' }}
          >
            {fill(textos.itinerary_ai_card_top_body ?? '')}
          </p>
          <button
            type="button"
            onClick={() => onChoose('top')}
            className="mt-4 w-full rounded-full py-3 text-[14px] font-bold text-white"
            style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
          >
            {textos.itinerary_ai_card_top_cta ?? "Let's Go"}
          </button>
        </div>
      </div>
    </div>
  );
}
