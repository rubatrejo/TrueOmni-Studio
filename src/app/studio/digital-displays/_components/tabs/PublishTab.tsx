'use client';

import { Send } from 'lucide-react';

/**
 * Tab `Publish` — placeholder DSS1.
 *
 * En DSS7 se cablea con el flujo GitHub PR auto-merge (mismo patrón que el
 * publish del kiosk). Convertirá la working copy del KV en commit a
 * `clients-signage/<slug>/`. Approval gate `ruben@trueomni.com`.
 */
export function PublishTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <Send className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
        Publish flow coming in DSS7
      </h3>
      <p className="max-w-md text-[12.5px] text-zinc-500">
        Convertirá la working copy del KV en commit a{' '}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px] dark:bg-zinc-800">
          clients-signage/&lt;slug&gt;/
        </code>{' '}
        vía GitHub PR auto-merge con approval gate, igual que el publish del kiosk.
      </p>
      <button
        type="button"
        disabled
        title="Publish flow comes in DSS7"
        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
      >
        <Send className="h-4 w-4" strokeWidth={1.75} />
        Publish theme
      </button>
    </div>
  );
}
