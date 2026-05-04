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
  hydrate: (data: {
    greeting: string;
    suggestedQuestions: AskAiSuggestedQuestion[];
    fallbackResponse: string;
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
  hydrate: ({ greeting, suggestedQuestions, fallbackResponse }) => {
    const { greeting: prevGreeting, displayedText, messages, isTyping } = get();
    set({ greeting, suggestedQuestions, fallbackResponse });
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
    const { suggestedQuestions, fallbackResponse } = get();
    const match = suggestedQuestions.find((q) => q.text === question);
    const response = match?.response ?? fallbackResponse;

    set((state) => ({
      messages: [...state.messages, { role: 'user', text: question }],
      isTyping: true,
      displayedText: '',
    }));

    // Pequeño delay para mostrar el indicador de typing.
    setTimeout(() => {
      set((state) => ({
        messages: [...state.messages, { role: 'ai', text: response }],
        isTyping: false,
      }));

      // Typewriter effect (15 ms/char — verbatim del paquete original).
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        charIndex++;
        set({ displayedText: response.slice(0, charIndex) });
        if (charIndex >= response.length) {
          clearInterval(typeInterval);
        }
      }, 15);
    }, 1200);
  },

  reset: () => {
    const { greeting } = get();
    set({ messages: [], displayedText: greeting, isTyping: false });
  },
}));
