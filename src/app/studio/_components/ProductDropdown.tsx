'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { getActiveProduct, STUDIO_PRODUCTS } from '../_lib/products';

/**
 * Dropdown que vive a la derecha del logo "TrueOmni Studio" en el
 * header. Muestra el producto activo (Kiosks por default) y al click
 * despliega los 4 productos del catálogo. El usuario navega entre ellos
 * sin recargar.
 *
 * Lenguaje visual: pill `bg-white border border-zinc-200 rounded-lg`
 * con icono del producto activo + label + chevron. Menu desplegable con
 * shadow + items con icono + label + dot ámbar (coming-soon) + check
 * (activo). Cero emojis.
 */
export function ProductDropdown() {
  const pathname = usePathname() ?? '';
  const active = getActiveProduct(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside / escape cierran.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Cierra al cambiar de ruta (después de un click en un item).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const ActiveIcon = active.icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80 dark:focus-visible:ring-zinc-600"
      >
        <ActiveIcon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.8} />
        <span>{active.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute left-0 top-[calc(100%+6px)] z-40 w-[280px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          >
            <div className="p-1.5">
              {STUDIO_PRODUCTS.map((product) => {
                const Icon = product.icon;
                const isActive = active.id === product.id;
                const isSoon = product.status === 'soon';
                return (
                  <Link
                    key={product.id}
                    href={product.href}
                    role="menuitem"
                    className={
                      'group flex items-center gap-3 rounded-lg px-2.5 py-3 transition ' +
                      (isActive
                        ? 'bg-zinc-100 dark:bg-zinc-900'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60')
                    }
                  >
                    <span
                      className={
                        'grid h-8 w-8 shrink-0 place-items-center rounded-md transition ' +
                        (isActive
                          ? 'bg-white text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700'
                          : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200')
                      }
                    >
                      <Icon className="h-[16px] w-[16px]" strokeWidth={1.75} />
                    </span>
                    <span
                      className={
                        'flex-1 truncate text-[13px] font-medium leading-tight ' +
                        (isActive
                          ? 'text-zinc-900 dark:text-white'
                          : 'text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-white')
                      }
                    >
                      {product.label}
                    </span>
                    {isSoon && !isActive && (
                      <span
                        aria-label="Coming soon"
                        title="Coming soon"
                        className="block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                      />
                    )}
                    {isActive && (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                        strokeWidth={2.5}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
