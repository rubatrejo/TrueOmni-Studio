'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';

/**
 * Wrapper que envuelve el Billboard idle y navega a `/home` (Main
 * Dashboard) al tocar cualquier zona NO interactiva.
 *
 * Antes era un `<Link>` literal — pero los Billboards modernos llevan
 * `<Link>` por slot (cuando el usuario asigna módulos en Studio), y los
 * `<a>` anidados son HTML inválido y producen warnings de Next/React.
 *
 * Solución: usar un `<div>` con click programático (`router.push`).
 * Cualquier descendiente con `data-billboard-no-link` (LanguageDropdown)
 * o que sea un `<a>` o `<button>` (slots con módulo, peeks del carousel)
 * mantiene su click — `closest()` en el target lo deja pasar.
 */
export function BillboardLink({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    // Cualquier sub-link (anchor, button, opt-out explícito) maneja su
    // propio click. Solo el "fondo" del Billboard navega a /home.
    if (target.closest('a, button, [data-billboard-no-link]')) return;
    e.preventDefault();
    router.push('/home');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Accesibilidad: Enter/Space sobre el wrapper navega a /home.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push('/home');
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Touch to start — opens the Main Dashboard"
      className="block focus:outline-none"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
