'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Onboarding tour del Studio (audit F-31).
 *
 * Modal de bienvenida con 5 pasos clave del flujo Branding → Modules →
 * Content → Preview → Publish. Solo se muestra al primer login (flag en
 * localStorage `studio:onboarding-seen`). Skip-able en cualquier paso.
 *
 * Implementado in-house para evitar deps pesadas (intro.js, shepherd.js
 * pesan ~150KB cada una). El tour es modal-based, no coach marks
 * spotlight, porque eso requiere portal + cálculo de DOM positioning
 * que no aporta valor proporcional a la complejidad.
 */
const STORAGE_KEY = 'studio:onboarding-seen';

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
        Open <strong>Branding</strong> in the sidebar. Drop your primary, secondary and tertiary hex
        colors plus a logo. Every kiosk module reads from those tokens — change them once, ship a
        new look.
      </>
    ),
  },
  {
    num: 2,
    title: 'Toggle the modules you want',
    body: (
      <>
        The <strong>Modules</strong> tab has master switches for the 19 modules. Turn off what you
        don&rsquo;t need — the corresponding tile, sidebar editor and i18n keys cascade off
        automatically.
      </>
    ),
  },
  {
    num: 3,
    title: 'Drop your content',
    body: (
      <>
        Listings, Events, Deals, Passes, Trails, Brochures — each editor has CSV import, bulk
        select, and an empty state with a one-click&nbsp;<em>Add</em>. You can paste a spreadsheet
        and have a kiosk loaded in minutes.
      </>
    ),
  },
  {
    num: 4,
    title: 'Verify in the live preview',
    body: (
      <>
        The right panel mirrors the kiosk in real time. Edits stream via postMessage in &lt;120ms.
        Switch orientation, zoom in, or open the kiosk full screen via the toolbar.
      </>
    ),
  },
  {
    num: 5,
    title: 'Publish when ready',
    body: (
      <>
        Hit <strong>Publish</strong> in the top bar. You&rsquo;ll see a per-file diff with the JSON
        keys that changed, confirm, and a GitHub PR is opened automatically. Once merged, Vercel
        deploys. The <strong>Versions</strong> tab keeps revertable snapshots of every save.
      </>
    ),
  },
];

const REPLAY_EVENT = 'studio:replay-onboarding';

/**
 * Limpia el flag de localStorage y emite un evento para que la instancia
 * montada de `<OnboardingTour>` reaparezca sin recargar la página.
 *
 * Útil desde un botón "Replay tour" en el footer del Studio (audit #11).
 */
export function replayOnboardingTour() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
  window.dispatchEvent(new Event(REPLAY_EVENT));
}

/**
 * Hook que devuelve `[shouldShow, dismiss]`. shouldShow es `true` solo
 * cuando el operador entra por primera vez al Studio (sin localStorage
 * marker) y deferimos la decisión hasta después del mount para evitar
 * hydration mismatch.
 */
function useOnboardingState(): [boolean, () => void] {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setShouldShow(true);
    } catch {
      // localStorage bloqueado (modo privado, etc.) — saltamos el tour.
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

export function OnboardingTour() {
  const [shouldShow, dismiss] = useOnboardingState();
  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const step = STEPS[stepIndex]!;
  const isLast = stepIndex === STEPS.length - 1;

  // Esperamos al mount cliente antes de portalizar — `document` no existe
  // durante SSR.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cada vez que el tour se abre (primer login o replay), arrancamos desde
  // el paso 1.
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
  }, [shouldShow, isLast, dismiss]);

  if (!mounted) return null;

  // Portal al `body` para evitar containing-block bugs si algún ancestor
  // (p.ej. el wrapper del theme provider) tiene `transform`. Sin el portal,
  // `position: fixed` queda relativo al ancestor con transform y el modal
  // termina descentrado.
  const content = (
    <AnimatePresence>
      {shouldShow && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
          <motion.div
            key="onboarding-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismiss}
            className="absolute inset-0 bg-zinc-950/75 backdrop-blur-md"
          />
          <motion.div
            key="onboarding-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
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

            {/* Hero — único título destacado del modal. Sparkles es el
                único icono visual, deliberadamente al lado del título. */}
            <div className="px-7 pb-4 pt-7">
              <div className="mb-5 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300">
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h2
                  id="onboarding-title"
                  className="font-display text-[22px] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white"
                >
                  Welcome to TrueOmni Studio
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
                    <span className="font-mono text-zinc-400 dark:text-zinc-600">{step.num}.</span>{' '}
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {step.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress dots + actions */}
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
              <div className="flex items-center gap-1">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  >
                    Skip tour
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isLast) dismiss();
                    else setStepIndex((i) => i + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {isLast ? "Let's go" : 'Next'}
                  {!isLast && <ArrowRight className="h-3 w-3" />}
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
