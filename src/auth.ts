import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

/**
 * NextAuth v5 — login con GitHub para el Studio.
 *
 * Provider único (GitHub) porque el repo de prod vive ya en GitHub: el
 * mismo identity provider que tenemos para el PR-publish (S7.2) sirve para
 * el login del Studio. Así evitamos sumar Google/SSO antes de que sea
 * necesario.
 *
 * El gate del Studio NO es "estás logueado en GitHub" — es "tu email está
 * en STUDIO_ADMIN_EMAILS". El callback `signIn` rechaza cualquier login
 * que no esté en la allowlist; el middleware bloquea sesiones inexistentes.
 *
 * Variables de entorno necesarias:
 *   - AUTH_GITHUB_ID, AUTH_GITHUB_SECRET (OAuth App)
 *   - AUTH_SECRET (firmado JWT)
 *   - AUTH_TRUST_HOST (Vercel preview/prod URLs distintas a localhost)
 *   - STUDIO_ADMIN_EMAILS (CSV de emails con acceso)
 */

function parseAdminEmails(): string[] {
  const raw = process.env.STUDIO_ADMIN_EMAILS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      // GitHub no devuelve el email primario en el perfil por defecto si es
      // privado — pedimos `user:email` scope explícitamente para forzar la
      // entrega del array de emails y poder matchear contra la allowlist.
      authorization: { params: { scope: 'read:user user:email' } },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allow = parseAdminEmails();
      // Si la allowlist está vacía, no permitimos NINGÚN login — el Studio
      // queda inaccesible hasta que se configure la env. Falla cerrada.
      if (allow.length === 0) {
        console.warn('[auth] STUDIO_ADMIN_EMAILS is empty — denying all logins.');
        return false;
      }
      const email = profile?.email?.toLowerCase().trim();
      if (!email) return false;
      return allow.includes(email);
    },
    async session({ session, token }) {
      // Propagar el email del token al session.user.email para que las API
      // routes puedan leerlo via `await auth()`.
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
});
