'use client';

import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useRef } from 'react';

import { useAiStore } from '@/stores/ai-store';

/**
 * Chips horizontales con stagger GSAP — verbatim del paquete original.
 * Lee `suggestedQuestions` del store (hidratado por <AiModalHost>).
 */
export function SuggestedQuestions() {
  const askQuestion = useAiStore((s) => s.askQuestion);
  const isTyping = useAiStore((s) => s.isTyping);
  const suggestedQuestions = useAiStore((s) => s.suggestedQuestions);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.from('.question-chip', {
        x: 20,
        opacity: 0,
        duration: 0.3,
        stagger: 0.04,
        ease: 'power3.out',
        delay: 0.2,
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="flex overflow-x-auto"
      style={{ gap: 14, paddingLeft: 36, paddingRight: 36 }}
    >
      {suggestedQuestions.map((q) => (
        <motion.button
          key={q.id}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => !isTyping && askQuestion(q.text)}
          className="question-chip flex-shrink-0 rounded-full"
          style={{
            paddingLeft: 28,
            paddingRight: 28,
            paddingTop: 16,
            paddingBottom: 16,
            backgroundColor: 'hsl(var(--ai-text-soft) / 0.06)',
            border: '2px solid hsl(var(--ai-text-soft) / 0.12)',
            opacity: isTyping ? 0.4 : 1,
            transition: 'opacity 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              color: 'hsl(var(--ai-text-soft))',
            }}
          >
            {q.text}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
