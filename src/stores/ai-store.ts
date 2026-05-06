'use client';

import { create } from 'zustand';

import type { AskAiSuggestedQuestion } from '@/lib/config';

type AiMessage = {
  role: 'user' | 'ai';
  text: string;
};

type AiStore = {
  // Hidratado por <AiModalHost> en el primer render con la data del cliente.
  greeting: string;
  suggestedQuestions: AskAiSuggestedQuestion[];
  fallbackResponse: string;
  /** Nombre del cliente activo, para enviar al endpoint /api/ai. */
  clientName: string;
  /** Locale activo (ISO 2-letter). El backend instruye a Claude a responder en él. */
  locale: string;
  /** Contexto del kiosk (módulos activos, location, etc.) — se envía como system prompt. */
  kioskContext: string;
  hydrate: (data: {
    greeting: string;
    suggestedQuestions: AskAiSuggestedQuestion[];
    fallbackResponse: string;
    clientName?: string;
    locale?: string;
    kioskContext?: string;
  }) => void;

  // Estado del modal.
  isOpen: boolean;
  open: () => void;
  close: () => void;

  // Estado de conversación.
  messages: AiMessage[];
  isTyping: boolean;
  displayedText: string;

  askQuestion: (question: string) => void;
  reset: () => void;
};

export const useAiStore = create<AiStore>((set, get) => ({
  greeting: '',
  suggestedQuestions: [],
  fallbackResponse: 'I can help with that! Let me look into it for you.',
  clientName: '',
  locale: 'en',
  kioskContext: '',
  hydrate: ({
    greeting,
    suggestedQuestions,
    fallbackResponse,
    clientName,
    locale,
    kioskContext,
  }) => {
    const { greeting: prevGreeting, displayedText, messages, isTyping } = get();
    set({
      greeting,
      suggestedQuestions,
      fallbackResponse,
      ...(clientName !== undefined ? { clientName } : {}),
      ...(locale !== undefined ? { locale } : {}),
      ...(kioskContext !== undefined ? { kioskContext } : {}),
    });
    // Re-alinea displayedText con el greeting cuando NO hay conversación en curso
    // (cubre el cambio de locale: greeting nuevo se ve sin esperar al siguiente
    // open/close del modal).
    const showingGreeting = !messages.length && !isTyping;
    if (showingGreeting && (displayedText === prevGreeting || !displayedText)) {
      set({ displayedText: greeting });
    }
  },

  isOpen: false,
  open: () => {
    const { greeting } = get();
    set({ isOpen: true, messages: [], displayedText: greeting, isTyping: false });
  },
  close: () => set({ isOpen: false, messages: [], displayedText: get().greeting, isTyping: false }),

  messages: [],
  isTyping: false,
  displayedText: '',

  askQuestion: (question: string) => {
    const { suggestedQuestions, fallbackResponse, clientName, locale, kioskContext } = get();
    const cannedMatch = suggestedQuestions.find((q) => q.text === question);

    set((state) => ({
      messages: [...state.messages, { role: 'user', text: question }],
      isTyping: true,
      displayedText: '',
    }));

    // Función que arranca el typewriter una vez tenemos la respuesta final.
    const startTypewriter = (response: string) => {
      set((state) => ({
        messages: [...state.messages, { role: 'ai', text: response }],
        isTyping: false,
      }));
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        charIndex++;
        set({ displayedText: response.slice(0, charIndex) });
        if (charIndex >= response.length) {
          clearInterval(typeInterval);
        }
      }, 15);
    };

    // 1) Match canned → respuesta instantánea (no llama LLM, no gasta tokens).
    if (cannedMatch?.response) {
      setTimeout(() => startTypewriter(cannedMatch.response), 1200);
      return;
    }

    // 2) Free-form → llama /api/ai con Anthropic. Si falla, cae al fallback.
    void (async () => {
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, clientName, locale, kioskContext }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { response?: string };
        const text = (data.response ?? '').trim();
        startTypewriter(text || fallbackResponse);
      } catch {
        // Silencioso: el operador del kiosk no necesita saber el error técnico,
        // sólo que la AI no respondió y mostramos el fallback configurable.
        startTypewriter(fallbackResponse);
      }
    })();
  },

  reset: () => {
    const { greeting } = get();
    set({ messages: [], displayedText: greeting, isTyping: false });
  },
}));
