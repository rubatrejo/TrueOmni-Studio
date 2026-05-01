import { Monitor } from 'lucide-react';
import Link from 'next/link';

import { StudioBrand } from './StudioBrand';

/**
 * Overlay que reemplaza al editor cuando el viewport es <1024px (Tailwind
 * `lg`). El editor del Studio (sidebar 240 + panel 480 + iframe portrait
 * 1080×1920) necesita al menos un laptop para ser usable. En tablets y
 * móviles se muestra este placeholder con CTAs para volver a la home o
 * abrir el kiosk en otra pestaña.
 *
 * Visible solo cuando `lg:hidden` aplica (i.e. viewport < 1024px). En
 * desktop el componente no se renderiza por la utility de Tailwind del
 * wrapper en Shell.tsx.
 */
export function EditorViewportGate({ slug, nombre }: { slug: string; nombre: string }) {
  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex h-14 shrink-0 items-center border-b border-zinc-200 bg-white px-5 dark:border-zinc-900 dark:bg-zinc-950">
        <StudioBrand />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
          <Monitor className="h-8 w-8" strokeWidth={1.4} />
        </div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Desktop required
        </p>
        <h1 className="mb-3 max-w-md font-display text-2xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          The kiosk editor needs a wider screen.
        </h1>
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Editing <span className="font-medium text-zinc-900 dark:text-white">{nombre}</span> requires
          at least <span className="font-mono text-zinc-700 dark:text-zinc-300">1024 px</span> to fit
          the live kiosk preview alongside the controls. Open this kiosk on a laptop or rotate your
          tablet to landscape.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/studio"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-5 text-[13px] font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Back to kiosks
          </Link>
          <Link
            href={`/?client=${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 text-[13px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Open kiosk in tab
          </Link>
        </div>
      </main>
    </div>
  );
}
