'use client';

export interface AiPopupTextos {
  title: string;
  subtitle: string;
  aiCardTitle: string;
  aiCardBody: string;
  aiCardCta: string;
  topCardTitle: string;
  topCardBody: string;
  topCardCta: string;
  closeAria?: string;
}

export interface AiPopupProps {
  textos: AiPopupTextos;
  onStart: () => void;
  onTopSuggestions: () => void;
  onClose: () => void;
}

function PathCard({
  iconColor,
  iconKind,
  title,
  body,
  ctaLabel,
  ctaColor,
  onTap,
}: {
  iconColor: string;
  iconKind: 'sparkle' | 'heart';
  title: string;
  body: string;
  ctaLabel: string;
  ctaColor: string;
  onTap: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-[20px] bg-zinc-50 px-8 py-6">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: iconColor }}
      >
        {iconKind === 'sparkle' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2l1.8 5.4L19 9.2 13.8 11 12 16.4 10.2 11 5 9.2l5.2-1.8L12 2zM5 16l.9 2.7L8.6 20l-2.7.9L5 23.5l-.9-2.7L1.5 20l2.7-.9L5 16z"
              fill="white"
            />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill="white"
            />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-[24px] font-bold text-foreground">{title}</h3>
      <p className="mt-3 text-center text-[15px] leading-relaxed text-zinc-600">{body}</p>
      <button
        type="button"
        onClick={onTap}
        className="mt-6 flex h-[56px] items-center justify-center rounded-full px-12 text-[18px] font-semibold text-white shadow-md"
        style={{ backgroundColor: ctaColor }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

/**
 * Modal del AI Itinerary Builder con dos paths: Start (AI) o Let's Go (Top
 * Suggestions). Ambos disparan el mismo wizard, los CTAs distintos son sólo
 * estilo / framing.
 */
export function AiPopup({ textos, onStart, onTopSuggestions, onClose }: AiPopupProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={textos.title}
    >
      <div className="absolute inset-0 bg-black/60" onPointerDown={onClose} aria-hidden="true" />
      <div className="relative flex w-[760px] flex-col items-center rounded-[28px] bg-white px-12 py-10 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={textos.closeAria ?? 'Close'}
          className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/85 text-white"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-center text-[26px] font-bold tracking-wide text-foreground">
          {textos.title}
        </h2>
        <p className="mt-4 text-center text-[16px] leading-relaxed text-zinc-600">
          {textos.subtitle}
        </p>
        <div className="mt-8 grid w-full grid-cols-1 gap-5">
          <PathCard
            iconColor="hsl(var(--primary))"
            iconKind="sparkle"
            title={textos.aiCardTitle}
            body={textos.aiCardBody}
            ctaLabel={textos.aiCardCta}
            ctaColor="hsl(var(--primary))"
            onTap={onStart}
          />
          <PathCard
            iconColor="hsl(var(--itinerary-olive))"
            iconKind="heart"
            title={textos.topCardTitle}
            body={textos.topCardBody}
            ctaLabel={textos.topCardCta}
            ctaColor="hsl(var(--itinerary-olive))"
            onTap={onTopSuggestions}
          />
        </div>
      </div>
    </div>
  );
}
