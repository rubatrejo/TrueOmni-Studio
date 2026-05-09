'use client';

import type { GeneratedEntry } from '@/lib/ai-itinerary';

export interface AiResultTimelineProps {
  entries: GeneratedEntry[];
  /** Labels visibles por kind, vienen de config.textos.itinerary_kind_*. */
  kindLabels: Record<GeneratedEntry['kind'], string>;
}

/** Lista vertical de entries con bullet azul y descripción. Sizes grandes
 *  pixel-close al SVG `Finish AI Itinerary` (kind label ~22-24px bold +
 *  descripción ~18px regular). */
export function AiResultTimeline({ entries, kindLabels }: AiResultTimelineProps) {
  return (
    <ul className="flex flex-col gap-7">
      {entries.map((entry, i) => (
        <li key={`${entry.kind}-${i}-${entry.slug}`} className="flex items-start gap-4">
          <span
            className="mt-3 inline-block h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
            aria-hidden="true"
          />
          <div className="flex-1 text-left">
            <p className="text-[29px] font-bold leading-tight text-foreground">
              {kindLabels[entry.kind]}
            </p>
            <p className="mt-1 text-[23px] leading-relaxed text-zinc-700">{entry.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
