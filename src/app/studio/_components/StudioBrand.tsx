import Link from 'next/link';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

/**
 * Brand mark del Studio.
 *
 * Reusa el componente `<TrueOmniLogo>` (extraído 1:1 del SVG oficial del
 * kiosk en `designs/TNT/Billboard/Billboard 0.svg`). El "Studio" se
 * cuelga del wordmark a la derecha como sub-pestaña visual.
 */
export function StudioBrand({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const logoH = size === 'sm' ? 'h-5' : 'h-6';
  const dividerH = size === 'sm' ? 'h-3.5' : 'h-4';
  const labelTxt = size === 'sm' ? 'text-[10.5px]' : 'text-[11px]';

  return (
    <Link
      href="/studio"
      className="group flex items-center gap-3 text-zinc-900 transition hover:text-black dark:text-zinc-100 dark:hover:text-white"
    >
      <TrueOmniLogo className={`${logoH} w-auto text-zinc-900 transition dark:text-white`} />
      <span className={`block w-px ${dividerH} bg-zinc-300 dark:bg-zinc-700`} aria-hidden="true" />
      <span
        className={`font-display font-medium uppercase tracking-[0.18em] text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200 ${labelTxt}`}
      >
        Studio
      </span>
    </Link>
  );
}
