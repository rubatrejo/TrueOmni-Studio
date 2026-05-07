'use client';

import { History } from 'lucide-react';

/**
 * Tab `Versions` — placeholder DSS1.
 *
 * En DSS6 se cablea con snapshots reales del KV (`signage:cfgSnap:*`).
 * Cada save creará un snapshot rotativo con cap. La UI mostrará lista de
 * versions, diff vs current, y restore.
 */
export function VersionsTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <History className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
        Version history coming in DSS6
      </h3>
      <p className="max-w-md text-[12.5px] text-zinc-500">
        Cada save creará un snapshot inmutable en KV con rotación FIFO. La UI
        mostrará la lista de versions, diff vs current, y permitirá restore con
        confirmación.
      </p>
    </div>
  );
}
