'use client';

/**
 * `<SaveStatusPill>` — indicador de estado de guardado ÚNICO de todos los
 * editores del Studio (kiosk, Digital Displays, Video Walls). Antes vivía
 * duplicado en `TopBar` (kiosk) y `SignageTopBar` (DD/VW); ahora es una sola
 * fuente de verdad para que no puedan divergir.
 *
 * Responsive: <lg solo el punto (con tooltip); lg-xl etiqueta corta; xl+
 * etiqueta completa.
 */
export function SaveStatusPill({
  state,
  isDirty,
}: {
  state: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
}) {
  const effective = (() => {
    if (state === 'saving')
      return {
        label: 'Saving…',
        short: 'Saving…',
        dot: 'bg-amber-400 animate-pulse',
        text: 'text-amber-600 dark:text-amber-300',
      };
    if (state === 'error')
      return {
        label: 'Save failed',
        short: 'Error',
        dot: 'bg-red-500',
        text: 'text-red-600 dark:text-red-400',
      };
    if (isDirty)
      return {
        label: 'Unsaved changes',
        short: 'Unsaved',
        dot: 'bg-sky-500 animate-pulse',
        text: 'text-sky-600 dark:text-sky-400',
      };
    if (state === 'saved')
      return {
        label: 'All changes saved',
        short: 'Saved',
        dot: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
      };
    return {
      label: 'No pending changes',
      short: 'Idle',
      dot: 'bg-zinc-400 dark:bg-zinc-600',
      text: 'text-zinc-500',
    };
  })();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 text-[11.5px] ${effective.text}`}
      title={effective.label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${effective.dot}`} />
      <span className="hidden lg:inline xl:hidden">{effective.short}</span>
      <span className="hidden xl:inline">{effective.label}</span>
    </span>
  );
}
