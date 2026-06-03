'use client';

import { useEffect, useState } from 'react';

import type { ScavengerTaskTypeInfo } from '@/lib/config';

import { TaskTypeIcon } from './task-type-icon';

const STORAGE_KEY = 'pwa-scavenger-hunt-welcomed';
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

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

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
      // Trigger slide-up animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, '1');
      setShow(false);
    }, 300);
  };

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40">
      <div
        className="flex flex-col items-center rounded-t-[20px] bg-white px-6 pb-6 pt-5 transition-transform duration-300 ease-out"
        style={{
          ...OPEN_SANS,
          height: '90%',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
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

        {/* Icono estrella (SVG, no emoji) */}
        <div
          className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-[16px] text-white"
          style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
        >
          <svg width={28} height={28} viewBox="0 0 24 24" fill="white">
            <path d="M12 2l2.09 6.26L20.18 9l-5.09 3.74L16.18 19 12 15.27 7.82 19l1.09-6.26L3.82 9l6.09-.74z" />
          </svg>
        </div>

        <h2 className="mb-2 text-[22px] font-bold text-gray-900">{title}</h2>
        <p className="mb-6 text-center text-[13px] leading-relaxed text-gray-500">{description}</p>

        {/* Task types con SVG icons */}
        <div className="mb-6 flex w-full flex-col gap-3">
          {taskTypes.map((t) => (
            <div
              key={t.icon}
              className="flex items-center gap-3 rounded-[12px] bg-gray-50 px-4 py-3"
            >
              <TaskTypeIcon type={t.icon} size={40} />
              <div>
                <p className="text-[14px] font-bold text-gray-800">{t.title}</p>
                <p className="text-[11px] text-gray-500">{t.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA — spacer para empujar al fondo */}
        <div className="flex-1" />
        <button
          type="button"
          onClick={dismiss}
          className="flex w-full items-center justify-center gap-2 rounded-full py-[14px] text-[14px] font-bold text-white"
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
