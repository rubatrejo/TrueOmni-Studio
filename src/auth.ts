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
 * en STUDIO_ADMIN_EMAILS o eres el SUPER_ADMIN_EMAIL". El callback
 * `signIn` rechaza cualquier login que no esté en la allowlist; el
 * middleware bloquea sesiones inexistentes.
 *
 * Super-admin: `ruba.trejo@gmail.com` (cuenta GitHub de Rubén) está
 * hardcoded como fallback. Garantiza acceso del owner aunque la env var
 * `STUDIO_ADMIN_EMAILS` quede vacía o mal configurada por accidente —
 * evita lockout permanente del Studio. Para añadir otros operadores
 * usar la env var (CSV).
 *
 * Variables de entorno necesarias:
 *   - AUTH_GITHUB_ID, AUTH_GITHUB_SECRET (OAuth App)
 *   - AUTH_SECRET (firmado JWT)
 *   - AUTH_TRUST_HOST (Vercel preview/prod URLs distintas a localhost)
 *   - STUDIO_ADMIN_EMAILS (CSV de emails adicionales con acceso, opcional)
 */

/**
 * Super-admin hardcoded del Studio. Owner del proyecto, no se borra ni se
 * cambia desde env var. Para revocarlo se necesita un commit explícito.
 */
const SUPER_ADMIN_EMAIL = 'ruba.trejo@gmail.com';

function parseAdminEmails(): string[] {
  const raw = process.env.STUDIO_ADMIN_EMAILS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isAuthorizedEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  if (normalized === SUPER_ADMIN_EMAIL) return true;
  return parseAdminEmails().includes(normalized);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      // GitHub no devuelve el email primario en el perfil por defecto si es
      // privado — pedimos `user:email` scope explícitamente para forzar la
      // entrega del array de emails y poder matchear contra la allowlist.
      // `prompt: 'select_account'` fuerza a GitHub a mostrar el selector de
      // cuenta cada vez. Necesario para que tras AccessDenied el operador
      // pueda elegir otra cuenta sin signOut explícito en GitHub.
      authorization: {
        params: { scope: 'read:user user:email', prompt: 'select_account' },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase().trim();
      if (!email) return false;
      // El super-admin SIEMPRE pasa, incluso si STUDIO_ADMIN_EMAILS está
      // vacía. Cualquier otro email tiene que estar en la env var (CSV).
      // Falla cerrada para todos los demás.
      if (!isAuthorizedEmail(email)) {
        if (parseAdminEmails().length === 0) {
          console.warn('[auth] STUDIO_ADMIN_EMAILS is empty — only the super-admin can sign in.');
        }
        return false;
      }
      return true;
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
  pages: {
    signIn: '/studio/sign-in',
  },
});
