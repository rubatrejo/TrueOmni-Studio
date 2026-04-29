'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useTextos } from '@/components/i18n-provider';
import { useIdleReset } from '@/hooks/use-idle-reset';
import { useLocaleStore } from '@/stores/locale-store';

interface IdleTimeoutOverlayProps {
  /** Segundos sin actividad antes del aviso. Default 60. */
  idleSeconds?: number;
  /** Segundos del countdown del aviso. Default 10. */
  warningSeconds?: number;
  /** Locale al que volver tras timeout. Default 'en'. */
  defaultLocale?: string;
  /** Locales habilitados (necesario para revertir el store correctamente). */
  availableLocales?: readonly string[];
}

/**
 * Overlay full-canvas que aparece cuando el kiosk lleva `idleSeconds` sin
 * interacción. Muestra mensaje + countdown de `warningSeconds`. Si no hay
 * interacción durante el countdown, resetea el locale al default y navega
 * a `/` (Billboard idle), reiniciando la sesión completa.
 *
 * Por convención NO se monta en `/` (la idle screen ya es la idle);
 * solo en rutas dentro de `/home/*`.
 */
export function IdleTimeoutOverlay({
  idleSeconds = 60,
  warningSeconds = 10,
  defaultLocale = 'en',
  availableLocales = ['en', 'es', 'fr', 'de', 'pt', 'ja'],
}: IdleTimeoutOverlayProps) {
  const t = useTextos();
  const router = useRouter();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const initFromSession = useLocaleStore((s) => s.initFromSession);
  const [overrideIdle, setOverrideIdle] = useState<number | null>(null);

  // Override del idle timeout desde el Studio (Billboard tab).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ idleTimeoutSec?: number }>).detail;
      if (typeof detail?.idleTimeoutSec === 'number' && detail.idleTimeoutSec >= 5) {
        setOverrideIdle(detail.idleTimeoutSec);
      }
    };
    window.addEventListener('kiosk:billboard-override', handler);
    return () => window.removeEventListener('kiosk:billboard-override', handler);
  }, []);

  const handleTimeout = useCallback(() => {
    // Resetear locale al default e ir al idle.
    setLocale(defaultLocale);
    // Borrar sessionStorage para que un usuario nuevo empiece sin estado.
    try {
      window.sessionStorage.clear();
    } catch {}
    initFromSession(defaultLocale, availableLocales);
    router.push('/');
  }, [defaultLocale, availableLocales, setLocale, initFromSession, router]);

  const { showWarning, secondsLeft, dismiss } = useIdleReset({
    idleSeconds: overrideIdle ?? idleSeconds,
    warningSeconds,
    onTimeout: handleTimeout,
  });

  const title = pick(t, 'idle_warning_title', 'Are you still there?');
  const body = pick(t, 'idle_warning_body', 'Touch the screen to continue your session.');
  const continueLabel = pick(t, 'idle_warning_continue', 'Yes, I am here');
  const countdownTpl = pick(t, 'idle_warning_countdown', 'Returning home in {seconds}s…');
  const countdownText = countdownTpl.replace('{seconds}', String(secondsLeft));

  return (
    <AnimatePresence>
      {showWarning && (
        <>
          {/* Backdrop full-screen, atrapa cualquier click para que no llegue al kiosk. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{ background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(4px)' }}
            onClick={dismiss}
            aria-hidden="true"
          />

          {/* Wrapper full-canvas con grid centering — evita combinar
              translate(-50%,-50%) con la animación de framer-motion (rompe
              el centrado dentro del iframe escalado del Studio). */}
          <div
            className="pointer-events-none fixed inset-0 grid place-items-center"
            style={{ zIndex: 201 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="idle-warning-title"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex flex-col items-center text-center"
              style={{
                width: '760px',
                padding: '64px 48px',
                borderRadius: '32px',
                background: '#fff',
                boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Countdown ring */}
            <CountdownRing total={warningSeconds} value={secondsLeft} />

            <h2
              id="idle-warning-title"
              className="font-display font-bold text-zinc-900"
              style={{ fontSize: '52px', lineHeight: 1.1, marginTop: '40px' }}
            >
              {title}
            </h2>
            <p
              className="text-zinc-600"
              style={{ fontSize: '28px', lineHeight: 1.4, marginTop: '20px', maxWidth: '560px' }}
            >
              {body}
            </p>
            <p
              className="font-mono text-zinc-500"
              style={{ fontSize: '22px', marginTop: '24px' }}
              aria-live="polite"
            >
              {countdownText}
            </p>

            <button
              type="button"
              onClick={dismiss}
              className="font-display font-bold text-white"
              style={{
                marginTop: '40px',
                padding: '20px 56px',
                fontSize: '30px',
                background: 'hsl(var(--brand-secondary))',
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 12px 24px -8px rgba(0,0,0,0.25)',
              }}
            >
              {continueLabel}
            </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function CountdownRing({ total, value }: { total: number; value: number }) {
  const SIZE = 132;
  const STROKE = 8;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * RADIUS;
  const progress = Math.max(0, Math.min(1, value / total));
  const offset = CIRC * (1 - progress);

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--brand-secondary) / 0.15)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--brand-secondary))"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 1s linear',
          }}
        />
      </svg>
      <div
        className="absolute inset-0 grid place-items-center font-display font-bold"
        style={{ fontSize: '52px', color: 'hsl(var(--brand-secondary))', lineHeight: 1 }}
      >
        {value}
      </div>
    </div>
  );
}

function pick(t: (key: string) => string, key: string, fallback: string): string {
  const r = t(key);
  return r === key ? fallback : r;
}
