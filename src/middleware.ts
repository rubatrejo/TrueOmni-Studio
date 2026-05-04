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
  // pasar todo. Esto evita que el Studio quede inaccesible en deploys
  // donde aún no se ha creado la GitHub OAuth App. La regla "fail closed"
  // sigue activa en signIn callback (sin allowlist no permite login),
  // pero el chrome del Studio queda navegable como demo.
  if (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET) {
    return NextResponse.next();
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
