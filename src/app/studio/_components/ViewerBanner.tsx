'use client';

import { Eye } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Banner fijo de "modo viewer" (solo lectura). Aparece cuando el operador entró
 * con el botón "Access as a viewer" de la pantalla de sign-in, que setea la
 * cookie `studio_viewer=1` (legible por JS, no httpOnly). El enforcement real
 * de solo-lectura lo hace el middleware (mutaciones → 403); este banner solo
 * comunica el estado y ofrece un atajo para iniciar sesión y editar.
 *
 * Se oculta en `/studio/sign-in` (la propia pantalla de login).
 */
export function ViewerBanner() {
  const pathname = usePathname();
  const [isViewer, setIsViewer] = useState(false);

  useEffect(() => {
    setIsViewer(document.cookie.split('; ').some((c) => c.trim() === 'studio_viewer=1'));
  }, [pathname]);

  if (!isViewer || pathname === '/studio/sign-in') return null;

  const exitViewer = () => {
    // Limpia la cookie y manda a sign-in para iniciar sesión como admin.
    document.cookie = 'studio_viewer=; path=/; max-age=0; samesite=lax';
    window.location.href = '/studio/sign-in';
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[2000] flex items-center justify-center gap-2 bg-amber-500/95 px-4 py-1.5 text-[12.5px] font-medium text-amber-950 shadow-sm backdrop-blur-sm">
      <Eye className="h-3.5 w-3.5 shrink-0" />
      <span>Read-only viewer — changes are disabled.</span>
      <button
        type="button"
        onClick={exitViewer}
        className="ml-1 rounded-md bg-amber-950/15 px-2 py-0.5 font-semibold text-amber-950 transition hover:bg-amber-950/25"
      >
        Sign in to edit
      </button>
    </div>
  );
}
