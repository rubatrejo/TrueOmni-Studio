'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';

/**
 * Wrapper que envuelve el Billboard idle en un `<Link href="/home">`
 * pero permite "islas" interactivas (ej. el LanguageDropdown) que NO
 * deben navegar al hacer click.
 *
 * Cualquier elemento descendiente con `data-billboard-no-link` (o que
 * sea hijo de uno con ese atributo) hace `preventDefault` en el click
 * del `<Link>`, dejando el evento al manejador del propio elemento.
 */
export function BillboardLink({ children }: { children: ReactNode }) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-billboard-no-link]')) {
      e.preventDefault();
    }
  };

  return (
    <Link
      href="/home"
      aria-label="Touch to start — opens the Main Dashboard"
      className="block focus:outline-none"
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
