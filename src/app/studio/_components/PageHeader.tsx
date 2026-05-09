'use client';

import { BookOpen, ChevronDown, LogOut, Settings, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

import { StudioBrand } from './StudioBrand';
import { ThemeToggle } from './ThemeToggle';

/**
 * Header reusado por las páginas content del Studio (home, docs).
 * DRY del patrón antes inlineado en varios archivos. Soporta:
 *
 * - `docsActive`: marca el link "Documentation" como activo (fondo azul).
 *
 * El antiguo `ProductDropdown` se eliminó cuando el Studio pasó al modelo
 * cliente-primero (la jerarquía vive en la URL `/studio/[client]/[product]`).
 *
 * Responsive: en mobile (`<sm`) Documentation se reduce a icono BookOpen sin
 * texto, y la user pill esconde el email completo dejando solo el avatar.
 */
export function StudioPageHeader({
  docsActive = false,
  // Mantenido para compat con callers que pasaban `showProductDropdown={false}`,
  // ya no afecta render. Eliminar en una limpieza futura.
  showProductDropdown: _showProductDropdown = true,
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
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/studio/docs" className={docsClass} aria-label="Documentation">
          <BookOpen className="h-4 w-4" strokeWidth={1.75} />
          <span className="hidden sm:inline">Documentation</span>
        </Link>
        <ThemeToggle />
        <UserDropdown email="ruben@trueomni.com" />
      </div>
    </header>
  );
}

/**
 * Dropdown del avatar (audit F-39). Antes era un pill decorativo. Ahora abre
 * un menú con accesos a Account / Sign out — placeholder hasta que la fase
 * S7.x entregue auth real con NextAuth.
 *
 * Click outside o Escape lo cierran. Ítems sin handler real muestran un
 * tooltip "Coming with auth" para no engañar al operador.
 */
function UserDropdown({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const initial = email.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80 sm:px-3"
      >
        <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-[11px] font-semibold text-zinc-900">
          {initial}
        </div>
        <span className="hidden text-xs text-zinc-600 dark:text-zinc-400 sm:inline">{email}</span>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 text-zinc-400 transition-transform sm:block ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/5"
        >
          <div className="border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-900">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-sm font-semibold text-zinc-900">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
                  {email.split('@')[0]}
                </div>
                <div className="truncate font-mono text-[10.5px] text-zinc-500 dark:text-zinc-500">
                  {email}
                </div>
              </div>
            </div>
          </div>
          <div className="py-1">
            <UserMenuItem
              icon={<UserCircle className="h-3.5 w-3.5" />}
              label="Account"
              hint="Coming soon"
            />
            <UserMenuItem
              icon={<Settings className="h-3.5 w-3.5" />}
              label="Preferences"
              hint="Coming soon"
            />
            <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-900" />
            <UserMenuItem
              icon={<LogOut className="h-3.5 w-3.5" />}
              label="Sign out"
              danger
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: '/studio/sign-in' });
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UserMenuItem({
  icon,
  label,
  hint,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return (
    <button
      type="button"
      role="menuitem"
      title={hint}
      disabled={!interactive}
      onClick={onClick}
      className={
        `flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[12.5px] transition ${interactive ? 'cursor-pointer' : 'cursor-not-allowed disabled:opacity-60'} ` +
        (danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10'
          : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900')
      }
    >
      <span className="flex items-center gap-2">
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
        {label}
      </span>
      {hint ? <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{hint}</span> : null}
    </button>
  );
}
