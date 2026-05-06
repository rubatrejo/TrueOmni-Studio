'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  type AiSuggestKind,
  type AiSuggestedItem,
  suggestContent,
} from '../_lib/api-client';

import { useToast } from './Toast';

interface AiSuggestModalProps {
  open: boolean;
  kind: AiSuggestKind;
  /** "Davenport, FL" — del clientInfo del kiosk. */
  location: string;
  /** Slugs ya existentes para que el AI no los duplique. */
  existingSlugs: string[];
  onClose: () => void;
  /** Cuando el operador confirma, se llaman con los items elegidos. El
   *  caller decide cómo merge-arlos al schema concreto del módulo. */
  onConfirm: (items: AiSuggestedItem[]) => void;
}

/**
 * Modal de AI suggestions (#26 audit). El operador elige cuántos items
 * generar, revisa los resultados con checkboxes y confirma cuáles añadir
 * al catálogo. Genérico — funciona para listings/events/deals/passes/etc.
 *
 * Backend: `/api/studio/ai/suggest` con Anthropic Claude Haiku.
 */
export function AiSuggestModal({
  open,
  kind,
  location,
  existingSlugs,
  onClose,
  onConfirm,
}: AiSuggestModalProps) {
  const toast = useToast();
  const [count, setCount] = useState(5);
  const [phase, setPhase] = useState<'config' | 'loading' | 'review'>('config');
  const [items, setItems] = useState<AiSuggestedItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setPhase('config');
    setItems([]);
    setSelected(new Set());
    setCount(5);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const parseLocation = (raw: string): { city: string; state: string } | null => {
    const m = raw.match(/^([^,]+),\s*([A-Z]{2})/);
    if (!m) return null;
    return { city: m[1].trim(), state: m[2] };
  };
  const parsed = parseLocation(location);

  const handleGenerate = async () => {
    if (!parsed) {
      toast.show('Cannot generate: kiosk location is missing or malformed', {
        variant: 'error',
        description: `Set the kiosk location to "City, ST" format first. Got: "${location}"`,
      });
      return;
    }
    setPhase('loading');
    try {
      const res = await suggestContent({
        kind,
        count,
        city: parsed.city,
        state: parsed.state,
        exclude: existingSlugs,
      });
      setItems(res.items);
      setSelected(new Set(res.items.map((i) => i.slug)));
      setPhase('review');
      toast.show(`${res.items.length} items generated`, {
        variant: 'success',
        description: `Used ${res.tokensUsed} tokens. Review and confirm which to add.`,
      });
    } catch (e) {
      console.error('[ai-suggest] failed', e);
      toast.show('AI suggestion failed', {
        variant: 'error',
        description: e instanceof Error ? e.message : String(e),
      });
      setPhase('config');
    }
  };

  const toggleSelected = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleConfirm = () => {
    const chosen = items.filter((i) => selected.has(i.slug));
    if (chosen.length === 0) {
      toast.show('No items selected', { variant: 'warning' });
      return;
    }
    onConfirm(chosen);
    toast.show(`${chosen.length} item${chosen.length === 1 ? '' : 's'} added`, {
      variant: 'success',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-zinc-950/70 backdrop-blur-md"
          />
          <div className="pointer-events-none fixed inset-0 z-[61] grid place-items-center p-4">
            <motion.div
              key="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-suggest-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex max-h-[80vh] w-[640px] max-w-[94vw] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-300">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <h2
                      id="ai-suggest-title"
                      className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                    >
                      Suggest {kind} with AI
                    </h2>
                    <p className="text-[11.5px] text-zinc-500">
                      Powered by Claude · cap 10 items per request
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {phase === 'config' ? (
                  <>
                    <div>
                      <p className="text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Generate plausible {kind} for{' '}
                        <strong className="font-medium text-zinc-800 dark:text-zinc-200">
                          {location || '— missing location —'}
                        </strong>
                        . You will review every item before adding it to the catalog.
                      </p>
                      {!parsed ? (
                        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                          Set the kiosk location to &quot;City, ST&quot; format (e.g. &quot;Davenport, FL&quot;)
                          before generating. Otherwise the AI has no geographic context.
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label
                        htmlFor="ai-suggest-count"
                        className="mb-1.5 block text-[12px] font-medium text-zinc-800 dark:text-zinc-200"
                      >
                        How many items?
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          id="ai-suggest-count"
                          type="range"
                          min={1}
                          max={10}
                          value={count}
                          onChange={(e) => setCount(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="w-8 text-center font-mono text-[13px] tabular-nums text-zinc-700 dark:text-zinc-300">
                          {count}
                        </span>
                      </div>
                    </div>
                  </>
                ) : phase === 'loading' ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-500">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                    <p className="text-[12.5px]">Generating {count} {kind}…</p>
                    <p className="text-[11px] text-zinc-400">Usually 2-5 seconds</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item) => {
                      const isSelected = selected.has(item.slug);
                      return (
                        <li
                          key={item.slug}
                          className={`rounded-lg border p-3 transition ${
                            isSelected
                              ? 'border-violet-300 bg-violet-50/50 dark:border-violet-700/50 dark:bg-violet-950/30'
                              : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40'
                          }`}
                        >
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelected(item.slug)}
                              className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-violet-600 focus:ring-violet-500/40"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-baseline gap-2">
                                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                                  {item.title}
                                </h3>
                                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
                                  {item.slug}
                                </span>
                              </div>
                              <p className="text-[11.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                {item.description}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                <span className="font-mono">{item.address}</span>
                              </p>
                              {item.tags && item.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {item.tags.map((t) => (
                                    <span
                                      key={t}
                                      className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                >
                  Cancel
                </button>
                {phase === 'config' ? (
                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={!parsed}
                    className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate
                  </button>
                ) : phase === 'review' ? (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={selected.size === 0}
                    className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    Add {selected.size} to catalog
                  </button>
                ) : null}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
