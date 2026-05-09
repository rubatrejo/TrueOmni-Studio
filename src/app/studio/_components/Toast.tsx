'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * Toast unificado del Studio (#18 audit).
 *
 * Reemplaza el banner global `errorMsg` del Shell + cualquier `alert()` y
 * `<WeatherCard>` ad-hoc. API mínima:
 *
 *   const { show } = useToast();
 *   show('Save failed', { variant: 'error' });
 *   show('Imported', { variant: 'success', durationMs: 3000 });
 *
 * Variantes: info (default) · success · warning · error.
 * Auto-dismiss: 4s para info/success/warning, sticky para error.
 * Stacking: hasta 5 toasts visibles, FIFO.
 * Posición: top-right del viewport, fixed.
 */

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  variant?: ToastVariant;
  /** Auto-dismiss en ms. 0 o negativo = sticky (default error sticky, resto 4000). */
  durationMs?: number;
  /** Subtítulo opcional bajo el mensaje principal. */
  description?: string;
}

interface ToastEntry {
  id: number;
  message: string;
  description?: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 5;
const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  info: 4000,
  success: 4000,
  warning: 6000,
  error: 0, // sticky por default — el operador necesita ver y entender
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, options?: ToastOptions): number => {
      const variant = options?.variant ?? 'info';
      const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS[variant];
      idRef.current += 1;
      const id = idRef.current;
      const entry: ToastEntry = {
        id,
        message,
        description: options?.description,
        variant,
        durationMs,
      };
      setToasts((prev) => {
        const next = [...prev, entry];
        // FIFO si excede MAX_VISIBLE — cancelamos el timer del descartado.
        while (next.length > MAX_VISIBLE) {
          const dropped = next.shift();
          if (dropped) {
            const timer = timersRef.current.get(dropped.id);
            if (timer) clearTimeout(timer);
            timersRef.current.delete(dropped.id);
          }
        }
        return next;
      });
      if (durationMs > 0) {
        const timer = setTimeout(() => dismiss(id), durationMs);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  // Cleanup en unmount: cualquier timer pendiente.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Soft fallback: si por alguna razón el provider no está montado, no
    // queremos crashear el editor — devolvemos un noop con warning.
    console.warn('[toast] useToast called outside <ToastProvider>');
    return {
      show: () => -1,
      dismiss: () => {},
    };
  }
  return ctx;
}

function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: ToastEntry[];
  dismiss: (id: number) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[360px] max-w-[92vw] flex-col gap-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} entry={t} onClose={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: ReactNode; iconBg: string }> = {
  info: {
    ring: 'ring-zinc-200 dark:ring-zinc-800',
    icon: <Info className="h-4 w-4" />,
    iconBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  success: {
    ring: 'ring-emerald-200 dark:ring-emerald-800/60',
    icon: <CheckCircle2 className="h-4 w-4" />,
    iconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    ring: 'ring-amber-200 dark:ring-amber-800/60',
    icon: <AlertCircle className="h-4 w-4" />,
    iconBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  error: {
    ring: 'ring-red-200 dark:ring-red-800/60',
    icon: <AlertCircle className="h-4 w-4" />,
    iconBg: 'bg-red-500/15 text-red-700 dark:text-red-300',
  },
};

function ToastCard({ entry, onClose }: { entry: ToastEntry; onClose: () => void }) {
  const style = VARIANT_STYLES[entry.variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto flex items-start gap-2.5 overflow-hidden rounded-lg bg-white p-3 shadow-lg ring-1 dark:bg-zinc-900 ${style.ring}`}
      role={entry.variant === 'error' || entry.variant === 'warning' ? 'alert' : 'status'}
    >
      <span
        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md ${style.iconBg}`}
        aria-hidden
      >
        {style.icon}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[12.5px] font-medium leading-tight text-zinc-900 dark:text-zinc-100">
          {entry.message}
        </p>
        {entry.description ? (
          <p className="text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
            {entry.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
