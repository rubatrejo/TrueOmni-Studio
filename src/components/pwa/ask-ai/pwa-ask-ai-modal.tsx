'use client';

import { Mic, SendHorizontal } from 'lucide-react';
import { useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { useTavusConversation } from '@/hooks/use-tavus-conversation';
import { useAiStore } from '@/stores/ai-store';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface PwaAskAiModalTexts {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  ariaClose: string;
  ariaSend: string;
  ariaMic: string;
}

/**
 * Modal mobile del Ask AI. Replica la UI del modal del kiosk (`ai-modal.tsx`) a
 * escala móvil: header consistente con el resto de pantallas PWA (90px, título
 * centrado, sin subtítulo), hero del avatar de video (Tavus) con caption en vivo
 * y micrófono push-to-talk con anillos, respuesta typewriter, chips de sugeridas
 * e input tipo píldora con botón send. Consume el `useAiStore` agnóstico (texto)
 * y el hook compartido `useTavusConversation` (video) — el mismo del kiosk.
 */
export function PwaAskAiModal({
  texts,
  clientName,
}: {
  texts: PwaAskAiModalTexts;
  clientName?: string;
}) {
  const isOpen = useAiStore((s) => s.isOpen);
  const close = useAiStore((s) => s.close);
  const messages = useAiStore((s) => s.messages);
  const displayedText = useAiStore((s) => s.displayedText);
  const isTyping = useAiStore((s) => s.isTyping);
  const suggestedQuestions = useAiStore((s) => s.suggestedQuestions);
  const askQuestion = useAiStore((s) => s.askQuestion);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const { avatarVideoRef, caption, isUnavailable } = useTavusConversation({
    isOpen,
    isListening,
    clientName,
  });

  useEscapeToClose(isOpen, close);

  if (!isOpen) return null;

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    askQuestion(q);
  };

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={texts.title}
      className="absolute inset-0 z-40 flex flex-col bg-background"
      style={OPEN_SANS}
    >
      {/* Header — mismo alto/posición de título que los headers de la PWA (90px,
          título centrado, sin subtítulo). El close (X) ocupa el slot derecho. */}
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ height: 90, backgroundColor: 'hsl(var(--brand-primary))' }}
      >
        <p
          className="text-[17px] font-bold tracking-[-0.024em] text-white"
          style={{ marginTop: 16 }}
        >
          {texts.title}
        </p>
        <button
          type="button"
          aria-label={texts.ariaClose}
          onClick={close}
          className="absolute right-3 flex h-10 w-10 items-center justify-center text-white"
          style={{ top: 40 }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Hero del avatar (Tavus) — réplica móvil del hero del kiosk. */}
      <div className="relative shrink-0 overflow-hidden bg-black" style={{ height: 320 }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={avatarVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Fade desde abajo hacia el cuerpo (como el gradient overlay del kiosk). */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background to-transparent" />

        {isUnavailable ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] text-white/70">
            <p>{texts.subtitle}</p>
          </div>
        ) : null}

        {/* Caption en vivo del avatar — pill con blur, estilo kiosk. */}
        {caption ? (
          <div
            className="absolute bottom-4 left-4 right-20 rounded-2xl px-4 py-2.5 backdrop-blur-md"
            style={{ backgroundColor: 'hsl(var(--brand-primary) / 0.65)' }}
          >
            <p className="text-center text-[13px] font-medium leading-snug text-white">{caption}</p>
          </div>
        ) : null}

        {/* Micrófono push-to-talk con anillos de "listening" (réplica del kiosk). */}
        <button
          type="button"
          aria-label={texts.ariaMic}
          aria-pressed={isListening}
          disabled={isUnavailable}
          onClick={() => setIsListening((v) => !v)}
          className="absolute bottom-4 right-4 grid h-14 w-14 place-items-center rounded-full text-white shadow-lg transition-transform active:scale-[0.94] disabled:opacity-40"
          style={{
            background:
              'linear-gradient(145deg, hsl(var(--brand-secondary)), hsl(var(--brand-primary)))',
          }}
        >
          {isListening ? (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(var(--brand-secondary)/0.45)]" />
              <span
                className="absolute inset-0 animate-ping rounded-full bg-[hsl(var(--brand-secondary)/0.3)]"
                style={{ animationDelay: '0.6s' }}
              />
            </>
          ) : null}
          <Mic className="relative h-6 w-6" />
        </button>
      </div>

      {/* Respuesta typewriter (cuerpo scrollable). */}
      <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-4">
        {lastUser ? (
          <p className="mb-3 text-right text-[14px] font-semibold text-foreground/70">
            {lastUser.text}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/80">
          {displayedText}
          {isTyping ? (
            <span
              className="ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-0.5 animate-pulse"
              style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
            />
          ) : null}
        </p>
      </div>

      {/* Chips de preguntas sugeridas (estilo kiosk: pill con borde suave). */}
      {suggestedQuestions.length > 0 ? (
        <div className="scrollbar-hide flex shrink-0 gap-2 overflow-x-auto px-5 pb-3">
          {suggestedQuestions.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => askQuestion(q.text)}
              className="shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-transform active:scale-[0.97]"
              style={{
                borderColor: 'hsl(var(--brand-secondary)/0.4)',
                backgroundColor: 'hsl(var(--brand-secondary)/0.06)',
                color: 'hsl(var(--brand-secondary))',
              }}
            >
              {q.text}
            </button>
          ))}
        </div>
      ) : null}

      {/* Input tipo píldora + botón send (estilo kiosk). */}
      <div className="flex shrink-0 items-center gap-2 border-t border-foreground/10 px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder={texts.inputPlaceholder}
          className="h-11 flex-1 rounded-full bg-foreground/5 px-4 text-[15px] text-foreground outline-none placeholder:text-foreground/40"
        />
        <button
          type="button"
          aria-label={texts.ariaSend}
          onClick={send}
          disabled={!input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-[0.94] disabled:opacity-30"
          style={{ color: 'hsl(var(--brand-secondary))' }}
        >
          <SendHorizontal className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
