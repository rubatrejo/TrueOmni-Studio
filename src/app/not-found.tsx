// not-found server component minimal — evita que Next 15 intente prerender
// el 404 default que arrastra Html/Head del shell de pages/. Necesario para
// que `pnpm build` (SSG) no falle.

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'system-ui, sans-serif',
        color: '#666',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>404</h1>
        <p style={{ fontSize: '14px' }}>Page not found</p>
      </div>
    </div>
  );
}
