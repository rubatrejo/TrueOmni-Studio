'use client';

export interface WelcomePopupTextos {
  intro: string;
  title: string;
  body: string;
  createCta: string;
  aiCta: string;
}

export interface WelcomePopupProps {
  textos: WelcomePopupTextos;
  onCreate: () => void;
  onAi: () => void;
  onClose: () => void;
}

/**
 * Welcome popup overlay del Itinerary Builder. Modal centrado al medio del
 * canvas con backdrop negro 50% sobre la pantalla manual de fondo.
 */
export function WelcomePopup(props: WelcomePopupProps) {
  const { textos, onCreate, onAi, onClose } = props;

  return (
    <div
      className="absolute inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={textos.title}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative flex w-[860px] flex-col items-center rounded-[28px] bg-white px-16 py-14 shadow-2xl"
          style={{ minHeight: 460 }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/85 text-white transition hover:bg-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-foreground/20"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <p className="font-display text-[28px] font-semibold tracking-[0.04em] text-foreground">
            {textos.intro}
          </p>
          <h1
            className="mt-5 text-center font-display text-[64px] font-bold uppercase leading-[1.05] tracking-tight"
            style={{ color: 'hsl(var(--primary))', whiteSpace: 'pre-line' }}
          >
            {textos.title}
          </h1>
          <p
            className="mt-7 max-w-[680px] text-center font-sans text-[20px] leading-[1.45] text-zinc-600"
            style={{ whiteSpace: 'pre-line' }}
          >
            {textos.body}
          </p>

          <div className="mt-10 flex items-center justify-center" style={{ gap: 14 }}>
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center justify-center rounded-full font-display font-bold uppercase tracking-[0.06em] transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              style={{
                backgroundColor: 'hsl(var(--itinerary-olive))',
                color: 'white',
                height: 56,
                paddingLeft: 28,
                paddingRight: 28,
                fontSize: 16,
                minWidth: 200,
              }}
            >
              {textos.createCta}
            </button>
            <button
              type="button"
              onClick={onAi}
              className="inline-flex items-center justify-center rounded-full font-display font-bold uppercase tracking-[0.06em] transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                height: 56,
                paddingLeft: 28,
                paddingRight: 28,
                fontSize: 16,
                minWidth: 200,
              }}
            >
              {textos.aiCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
