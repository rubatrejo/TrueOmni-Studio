'use client';

import { useEffect, useState } from 'react';

import { useSafeTimeout } from '@/hooks/use-safe-timeout';
import type { ScavengerTaskTypeInfo } from '@/lib/config';

import { TaskTypeIcon } from './task-type-icon';

const STORAGE_KEY = 'pwa-scavenger-hunt-welcomed';
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

// Show-once: el welcome sale solo la primera vez (persistido en localStorage).
// Aprobado por Rubén 2026-06-03. Poner en `true` solo si hay que volver a revisar el diseño.
const ALWAYS_SHOW_FOR_REVIEW = false;

interface HuntWelcomeSheetProps {
  title: string;
  description: string;
  taskTypes: ScavengerTaskTypeInfo[];
  button: string;
}

/**
 * Bottom-sheet de bienvenida al Scavenger Hunt. Sube desde abajo cubriendo
 * ~90% de la pantalla con animación. Se muestra solo la primera vez.
 */
export function HuntWelcomeSheet({ title, description, taskTypes, button }: HuntWelcomeSheetProps) {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const schedule = useSafeTimeout();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (ALWAYS_SHOW_FOR_REVIEW || !localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
      // Trigger slide-up animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    // Persistir inmediato (no perderlo si se desmonta durante el fade) — C6.
    if (!ALWAYS_SHOW_FOR_REVIEW) localStorage.setItem(STORAGE_KEY, '1');
    schedule(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
      <div
        className="flex w-full max-w-[400px] flex-col items-center rounded-[12px] bg-white px-6 pb-6 pt-5 transition-all duration-300 ease-out"
        style={{
          ...OPEN_SANS,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        {/* Close X */}
        <button
          type="button"
          onClick={dismiss}
          className="mb-2 self-end text-[20px] text-gray-400"
          aria-label="Close"
        >
          <svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor">
            <path
              d="M12.5 3.5l-9 9M3.5 3.5l9 9"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Icono estrella: cuadrado navy + círculo interior + sparkle 4 puntas (verbatim XD) */}
        <div
          className="mb-3 flex h-[70px] w-[70px] items-center justify-center rounded-[18px]"
          style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
        >
          <svg width={70} height={70} viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="18" fill="white" opacity="0.16" />
            <path
              d="M30 17c1.2 8.5 4.3 11.6 12.8 12.8C34.3 31 31.2 34.1 30 42.6 28.8 34.1 25.7 31 17.2 29.8 25.7 28.6 28.8 25.5 30 17z"
              fill="white"
            />
          </svg>
        </div>

        <h2 className="mb-1.5 text-[25px] font-bold text-gray-900">{title}</h2>
        <p className="mb-4 text-center text-[15px] leading-relaxed text-gray-500">{description}</p>

        {/* Task types con SVG icons */}
        <div className="mb-3 flex w-full flex-col gap-3">
          {taskTypes.map((t) => (
            <div
              key={t.icon}
              className="flex items-center gap-3.5 rounded-[14px] bg-gray-50 px-4 py-3"
            >
              <TaskTypeIcon type={t.icon} size={48} />
              <div>
                <p className="text-[16px] font-bold text-gray-800">{t.title}</p>
                <p className="text-[13px] text-gray-500">{t.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full py-[15px] text-[16px] font-bold text-white"
          style={{ backgroundColor: 'hsl(var(--brand-secondary, 195 100% 42%))' }}
        >
          {button}
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
