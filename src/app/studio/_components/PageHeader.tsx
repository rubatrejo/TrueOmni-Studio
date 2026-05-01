import { BookOpen } from 'lucide-react';
import Link from 'next/link';

import { ProductDropdown } from './ProductDropdown';
import { StudioBrand } from './StudioBrand';
import { ThemeToggle } from './ThemeToggle';

/**
 * Header reusado por las páginas content del Studio (home, docs,
 * coming-soon). DRY del patrón antes inlineado en 3 archivos. Soporta:
 *
 * - `docsActive`: marca el link "Documentation" como activo (fondo azul).
 * - `showProductDropdown`: muestra el dropdown de productos junto al
 *   wordmark (true en home + coming-soon, false en docs).
 *
 * Responsive:
 * - En mobile (`<sm`), Documentation se reduce a icono BookOpen sin
 *   texto, y la user pill esconde el email completo dejando solo el
 *   avatar circle. Esto evita que el header se desborde en viewports
 *   pequeños (<400px) sin sacrificar la identidad de la marca.
 */
export function StudioPageHeader({
  docsActive = false,
  showProductDropdown = true,
}: {
  docsActive?: boolean;
  showProductDropdown?: boolean;
}) {
  const docsBaseClass =
    'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition sm:px-4';
  const docsClass = docsActive
    ? `${docsBaseClass} border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-300`
    : `${docsBaseClass} border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80`;

  return (
    <header className="mb-16 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 sm:gap-4">
        <StudioBrand />
        {showProductDropdown && <ProductDropdown />}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/studio/docs" className={docsClass} aria-label="Documentation">
          <BookOpen className="h-4 w-4" strokeWidth={1.75} />
          <span className="hidden sm:inline">Documentation</span>
        </Link>
        <ThemeToggle />
        <div className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-900 sm:px-3">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-[11px] font-semibold text-zinc-900">
            R
          </div>
          <span className="hidden text-xs text-zinc-600 dark:text-zinc-400 sm:inline">
            ruben@trueomni.com
          </span>
        </div>
      </div>
    </header>
  );
}
