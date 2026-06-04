'use client';

import { useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { useAiStore } from '@/stores/ai-store';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface PwaAskAiModalTexts {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  ariaClose: string;
  ariaSend: string;
}

/**
 * Modal mobile del Ask AI (390-space). Consume el `useAiStore` agnóstico (mismo store y
 * endpoint `/api/ai` que el kiosk): greeting + typewriter, chips de sugeridas y entrada
 * libre. Sin avatar Tavus (solo texto). El teclado lo provee el `PwaKeyboardProvider`
 * montado en `MobileCanvas` al enfocar el input. Va bajo los ads (z-40).
 */
export function PwaAskAiModal({ texts }: { texts: PwaAskAiModalTexts }) {
  const isOpen = useAiStore((s) => s.isOpen);
  const close = useAiStore((s) => s.close);
  const messages = useAiStore((s) => s.messages);
  const displayedText = useAiStore((s) => s.displayedText);
  const isTyping = useAiStore((s) => s.isTyping);
  const suggestedQuestions = useAiStore((s) => s.suggestedQuestions);
  const askQuestion = useAiStore((s) => s.askQuestion);
  const [input, setInput] = useState('');

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
      {/* Header */}
      <div
        className="relative flex shrink-0 items-center justify-center px-5"
        style={{ height: 64, backgroundColor: 'hsl(var(--brand-primary))' }}
      >
        <div className="text-center text-white">
          <p className="text-[17px] font-bold leading-tight">{texts.title}</p>
          {texts.subtitle ? (
            <p className="text-[11px] leading-tight text-white/80">{texts.subtitle}</p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={texts.ariaClose}
          onClick={close}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Conversación */}
      <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-4">
        {lastUser ? (
          <p className="mb-3 text-right text-[14px] font-semibold text-foreground/70">
            {lastUser.text}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
          {displayedText}
          {isTyping ? <span className="animate-pulse">▍</span> : null}
        </p>
      </div>

      {/* Chips de preguntas sugeridas */}
      {suggestedQuestions.length > 0 ? (
        <div className="scrollbar-hide flex shrink-0 gap-2 overflow-x-auto px-5 pb-3">
          {suggestedQuestions.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => askQuestion(q.text)}
              className="shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-transform active:scale-[0.97]"
              style={{
                borderColor: 'hsl(var(--brand-secondary)/0.5)',
                color: 'hsl(var(--brand-secondary))',
              }}
            >
              {q.text}
            </button>
          ))}
        </div>
      ) : null}

      {/* Input + enviar */}
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-transform active:scale-[0.94] disabled:opacity-40"
          style={{ backgroundColor: 'hsl(var(--pwa-primary))' }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 12l16-8-6 16-2-6-6-2z"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
