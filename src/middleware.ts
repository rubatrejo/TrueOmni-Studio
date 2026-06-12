import { NextResponse } from 'next/server';

import { auth } from '@/auth';

/**
 * Middleware del Studio.
 *
 * Protege `/studio/*` y `/api/studio/*` con NextAuth (S7.3). El kiosk runtime
 * (`/`, `/home`, `/billboard`, etc.) queda público — los kiosks dedicados no
 * deben pedir login.
 *
 * Cuando hay sesión válida, inyecta `X-Studio-Admin-Email` en los headers
 * de la request para que las API routes (especialmente
 * `/api/studio/publish/[slug]`) puedan leerlo y aplicar el allowlist sin
 * tener que cargar `auth()` en cada handler.
 *
 * Si no hay sesión, redirige a la página de sign-in que NextAuth genera
 * automáticamente (`/api/auth/signin`) con `callbackUrl` para volver
 * después.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Válvula: si NextAuth no está configurado (no hay OAuth App), dejamos
  // navegable el chrome del Studio como demo, pero NO abrimos las mutaciones.
  // Esto evita que el Studio quede inaccesible en deploys donde aún no se ha
  // creado la GitHub OAuth App, sin dejar la puerta abierta a destrucción.
  if (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET) {
    // F-CORE-1: sin auth, un deploy mal configurado dejaba TODO `/api/studio/*`
    // público — incluido `DELETE /api/studio/clients/[slug]` (borra el cliente).
    // En PRODUCCIÓN bloqueamos las mutaciones con 503 (las páginas y los GET de
    // lectura siguen navegables como demo). En desarrollo local NO se bloquea:
    // el dev no tiene OAuth App configurada y debe poder usar el editor.
    const isStudioApiMutation =
      pathname.startsWith('/api/studio') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    if (process.env.NODE_ENV === 'production' && isStudioApiMutation) {
      return NextResponse.json(
        { error: 'Studio auth is not configured on this deployment.' },
        { status: 503 },
      );
    }
    // F-CORE-10: sin una sesión que lo respalde, `x-studio-admin-email` es
    // forjable por el cliente. Lo borramos para que ningún handler confíe en un
    // actor falso (el approval gate del publish lee este header).
    const headers = new Headers(req.headers);
    headers.delete('x-studio-admin-email');
    return NextResponse.next({ request: { headers } });
  }

  const isStudioApp = pathname.startsWith('/studio');
  const isStudioApi = pathname.startsWith('/api/studio');
  // `/api/auth/*` y `/api/studio/[slug]/...` (el endpoint público de
  // i18n/translate disponible para preview público) no se protegen.
  // Por defecto sí protegemos /api/studio/*.

  if (!isStudioApp && !isStudioApi) {
    return NextResponse.next();
  }

  // Short-circuit: la página custom de sign-in es por definición pública.
  // Sin esto, el matcher `/studio/:path*` la incluye → middleware redirige
  // a sí misma en loop infinito.
  if (pathname === '/studio/sign-in') {
    return NextResponse.next();
  }

  const email = req.auth?.user?.email;

  if (!email) {
    // Modo viewer: el botón "Access as a viewer" de la pantalla de sign-in
    // setea la cookie `studio_viewer`. Permite NAVEGAR el Studio (páginas +
    // GETs de lectura) sin login GitHub, pero las mutaciones se bloquean con
    // 403 — "ingresar y navegar sin mover nada". El admin (sesión GitHub) gana
    // siempre: si hay `email`, ni se evalúa esta rama. La cookie no es httpOnly
    // (la UI la lee para el banner), pero forjarla solo da acceso de lectura,
    // así que no es un vector de escalada.
    const isViewer = req.cookies.get('studio_viewer')?.value === '1';
    if (isViewer) {
      const isMutation = isStudioApi && !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
      if (isMutation) {
        return NextResponse.json({ error: 'Read-only viewer — sign in to edit.' }, { status: 403 });
      }
      // Sin sesión que lo respalde, `x-studio-admin-email` es forjable: lo
      // borramos para que ningún handler confíe en un actor falso.
      const headers = new Headers(req.headers);
      headers.delete('x-studio-admin-email');
      return NextResponse.next({ request: { headers } });
    }

    // Para APIs devolvemos 401 JSON; para páginas redirigimos a sign-in.
    if (isStudioApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/studio/sign-in';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Sesión válida — propagar email a downstream handlers.
  const headers = new Headers(req.headers);
  headers.set('x-studio-admin-email', email);

  return NextResponse.next({ request: { headers } });
});

export const config = {
  // Excluimos /_next, archivos estáticos, y /api/auth (NextAuth handler).
  matcher: ['/studio/:path*', '/api/studio/:path*'],
};
