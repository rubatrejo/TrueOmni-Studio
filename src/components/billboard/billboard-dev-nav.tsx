'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const VARIANTS = [0, 1, 2, 3, 4] as const;

/**
 * Navegador dev-only para alternar entre las 5 variantes del Billboard.
 * Se oculta en producción. Cambia `?variant=N` en la URL y el
 * componente Billboard lo consume para seleccionar.
 */
export function BillboardDevNav() {
  const params = useSearchParams();
  const current = Number(params.get('variant') ?? 0);

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/75 px-3 py-2 shadow-xl backdrop-blur-md">
      <span className="select-none px-2 text-xs font-medium uppercase tracking-wider text-white/70">
        Billboard
      </span>
      {VARIANTS.map((n) => {
        const isActive = current === n;
        return (
          <Link
            key={n}
            href={`/?variant=${n}`}
            replace
            scroll={false}
            className={[
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors',
              isActive ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/25',
            ].join(' ')}
            aria-label={`Ver Billboard ${n}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {n}
          </Link>
        );
      })}
    </div>
  );
}
