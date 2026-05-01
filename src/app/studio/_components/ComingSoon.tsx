import Link from 'next/link';

import type { StudioProduct } from '../_lib/products';

import { ProductDropdown } from './ProductDropdown';
import { StudioBrand } from './StudioBrand';
import { ThemeToggle } from './ThemeToggle';

/**
 * Placeholder reutilizable para productos del Studio que aún no están
 * implementados. Espejo del lenguaje visual de la home (`/studio`):
 * mismo header (StudioBrand + ProductDropdown + Documentation + theme +
 * user), mismo footer, contenido centrado con icono lucide grande +
 * título + párrafo descriptivo + pill ámbar.
 */
export function ComingSoon({ product }: { product: StudioProduct }) {
  const Icon = product.icon;

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-8 pb-24 pt-12">
      {/* Top bar — idéntico al de /studio para mantener consistencia. */}
      <header className="mb-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <StudioBrand />
          <ProductDropdown />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/studio/docs"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
          >
            Documentation
          </Link>
          <ThemeToggle />
          <div className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-[11px] font-semibold text-zinc-900">
              R
            </div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">ruben@trueomni.com</span>
          </div>
        </div>
      </header>

      {/* Centered placeholder */}
      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="mb-7 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-400">
          <span className="block h-1.5 w-1.5 rounded-full bg-amber-500" />
          Coming soon
        </span>

        <div className="mb-8 grid h-24 w-24 place-items-center rounded-3xl border border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-600">
          <Icon className="h-11 w-11" strokeWidth={1.4} />
        </div>

        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          TrueOmni Studio
        </p>

        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-zinc-900 dark:text-white">
          {product.label}
        </h1>

        {product.comingSoonCopy && (
          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {product.comingSoonCopy}
          </p>
        )}

        <p className="mt-10 text-[12.5px] text-zinc-400 dark:text-zinc-600">
          We&rsquo;re shaping this module — switch back to{' '}
          <Link
            href="/studio"
            className="font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
          >
            Kiosks
          </Link>{' '}
          to keep working in the meantime.
        </p>
      </section>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · TrueOmni Studio v0.1</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </span>
          <span>Local · main</span>
        </div>
      </footer>
    </main>
  );
}
