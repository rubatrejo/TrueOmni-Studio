'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

/**
 * Un nivel del breadcrumb del Studio.
 *  - `href` presente → link clickeable (permite volver a ese nivel).
 *  - `href` ausente  → nivel actual (último): texto en negrita, no navegable.
 *  - `icon`          → icono opcional a la izquierda del label (favicon del
 *                      cliente, icono de pantalla del producto, etc.).
 *  - `slug`          → pill monoespaciado a la derecha (slug del ítem actual).
 */
export interface Crumb {
  label: string;
  href?: string;
  icon?: ReactNode;
  slug?: string;
}

/**
 * `<Breadcrumb>` — migas de pan canónicas y ÚNICAS de todo el Studio.
 *
 * Trail estándar `Clients › {Cliente} › {Producto} › {Ítem}`. Cada nivel
 * (menos el actual) es un link para regresar cuantos niveles haga falta. Es
 * idéntico en todos los productos / editores / clientes: una sola fuente de
 * verdad reemplaza los breadcrumbs duplicados que vivían en TopBar /
 * SignageTopBar / WallTopBar / páginas de lista.
 *
 * Responsive: en pantallas <xl se colapsan los niveles intermedios y solo se
 * muestra el nivel actual (con su icono + slug pill). En xl+ se ve el trail
 * completo.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-zinc-500">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        // `max-w` + `truncate`: los labels cortos ("Clients", "Kiosk") se ven
        // completos; solo un nombre largo de cliente/ítem se recorta con "…".
        const labelClass = `max-w-[220px] truncate ${
          isLast ? 'font-medium text-zinc-900 dark:text-zinc-100' : ''
        }`;
        const content = (
          <>
            {item.icon ? <span className="flex shrink-0 items-center">{item.icon}</span> : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={`${labelClass} transition hover:text-zinc-800 dark:hover:text-zinc-300`}
              >
                {item.label}
              </Link>
            ) : (
              <span className={labelClass}>{item.label}</span>
            )}
            {item.slug ? (
              <span
                className="ml-1 shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500"
                title={item.slug}
              >
                {item.slug}
              </span>
            ) : null}
          </>
        );
        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 ? (
              <ChevronRight
                className="hidden h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-700 xl:block"
                aria-hidden="true"
              />
            ) : null}
            <span className={`shrink-0 items-center gap-1.5 ${isLast ? 'flex' : 'hidden xl:flex'}`}>
              {content}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Icono de "pantalla/display" reutilizado en el nivel final de los editores de
 * Digital Displays y Video Walls (era markup SVG duplicado en cada top bar).
 */
export function ScreenCrumbIcon() {
  return (
    <span className="grid h-4 w-4 place-items-center rounded-sm bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
      <svg
        width="10"
        height="10"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="1.5" y="3" width="13" height="9" rx="1" />
        <line x1="6" y1="14" x2="10" y2="14" />
      </svg>
    </span>
  );
}
