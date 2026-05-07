'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Onboarding tour del editor signage. Modal-based, paralelo al del kiosk
 * (`OnboardingTour.tsx`) pero con steps específicos del flow signage.
 *
 * Storage key separada (`signage:onboarding-seen`) para que el operador que
 * ya conoce el editor del kiosk vea este tour la primera vez que entra al
 * theme editor signage.
 *
 * Replay: `signage:replay-onboarding` event.
 */

const STORAGE_KEY = 'signage:onboarding-seen';
const REPLAY_EVENT = 'signage:replay-onboarding';

interface TourStep {
  num: number;
  title: string;
  body: ReactNode;
}

const STEPS: TourStep[] = [
  {
    num: 1,
    title: 'Pick your brand',
    body: (
      <>
        En <strong>Branding</strong> defines los 4 brand tokens (primary,
        secondary, accent, neutral), logos y fonts. Cualquier cambio se
        recolorea en el preview en menos de 200&nbsp;ms vía bridge postMessage.
      </>
    ),
  },
  {
    num: 2,
    title: 'Tune the header',
    body: (
      <>
        El tab <strong>Header</strong> controla la barra superior del runtime:
        position (top/bottom), height, layout del logo, visibility de clima y
        reloj, y el background (color sólido, gradient o imagen).
      </>
    ),
  },
  {
    num: 3,
    title: 'Manage displays',
    body: (
      <>
        Un theme puede tener varios displays (lobby-tv, entrance-tv, etc.).
        Desde el tab <strong>Displays</strong> entras al editor por display
        donde armas la playlist con drag-to-reorder, dayparting y schedule.
      </>
    ),
  },
  {
    num: 4,
    title: 'Translate with AI',
    body: (
      <>
        En <strong>Languages</strong> editas las strings localizadas. Si tienes
        DeepL o Anthropic configurado, el botón <span aria-hidden>✨</span>{' '}
        traduce keys faltantes en un click.
      </>
    ),
  },
  {
    num: 5,
    title: 'Versions & Publish',
    body: (
      <>
        Cada save crea snapshot reversible del estado previo (cap 10) en el
        tab <strong>Versions</strong>. Cuando quieras shipear, pulsa{' '}
        <strong>Publish</strong> arriba a la derecha — abre PR con{' '}
        <code className="font-mono text-[11.5px]">client.json</code>,{' '}
        <code className="font-mono text-[11.5px]">tokens.css</code> y{' '}
        <code className="font-mono text-[11.5px]">i18n/*.json</code>.
      </>
    ),
  },
];

export function replaySignageOnboardingTour() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
  window.dispatchEvent(new Event(REPLAY_EVENT));
}

function useOnboardingState(): [boolean, () => void] {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setShouldShow(true);
    } catch {
      // localStorage bloqueado: saltamos el tour.
    }
    const onReplay = () => setShouldShow(true);
    window.addEventListener(REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(REPLAY_EVENT, onReplay);
  }, []);

  const dismiss = () => {
    setShouldShow(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {}
  };

  return [shouldShow, dismiss];
}

export function SignageOnboardingTour() {
  const [shouldShow, dismiss] = useOnboardingState();
  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const step = STEPS[stepIndex]!;
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (shouldShow) setStepIndex(0);
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'ArrowRight') {
        if (isLast) dismiss();
        else setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
      }
      if (e.key === 'ArrowLeft') setStepIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow, isLast]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {shouldShow ? (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
          <motion.div
            key="signage-onboarding-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismiss}
            className="absolute inset-0 bg-zinc-950/75 backdrop-blur-md"
          />
          <motion.div
            key="signage-onboarding-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signage-onboarding-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-[min(520px,100%)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/5"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Skip tour"
              className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="px-7 pb-4 pt-7">
              <div className="mb-5 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/15 text-sky-600 ring-1 ring-inset ring-sky-500/30 dark:text-sky-300">
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h2
                  id="signage-onboarding-title"
                  className="font-display text-[22px] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white"
                >
                  Digital Displays Studio
                </h2>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <h3 className="font-display text-[16px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white">
                    <span className="font-mono text-zinc-400 dark:text-zinc-600">
                      {step.num}.
                    </span>{' '}
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {step.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="flex items-center justify-between border-t border-zinc-200 px-7 py-3.5 dark:border-zinc-900">
              <div className="flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setStepIndex(i)}
                    aria-label={`Go to step ${s.num}: ${s.title}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === stepIndex
                        ? 'w-6 bg-zinc-900 dark:bg-white'
                        : i < stepIndex
                          ? 'w-1.5 bg-zinc-400 dark:bg-zinc-600'
                          : 'w-1.5 bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (isLast) dismiss();
                    else setStepIndex((i) => i + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {isLast ? 'Got it' : 'Next'}
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
