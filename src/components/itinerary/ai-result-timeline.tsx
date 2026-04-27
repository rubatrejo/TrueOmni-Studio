'use client';

import type { GeneratedEntry } from '@/lib/ai-itinerary';

export interface AiResultTimelineProps {
  entries: GeneratedEntry[];
  /** Labels visibles por kind, vienen de config.textos.itinerary_kind_*. */
  kindLabels: Record<GeneratedEntry['kind'], string>;
}

/** Lista vertical de entries con bullet azul y descripción. */
export function AiResultTimeline({ entries, kindLabels }: AiResultTimelineProps) {
  return (
    <ul className="flex flex-col gap-5">
      {entries.map((entry, i) => (
        <li key={`${entry.kind}-${i}-${entry.slug}`} className="flex items-start gap-3">
          <span
            className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
            aria-hidden="true"
          />
          <div className="flex-1 text-left">
            <p className="text-[18px] font-bold text-foreground">{kindLabels[entry.kind]}</p>
            <p className="text-[15px] leading-relaxed text-zinc-700">{entry.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
