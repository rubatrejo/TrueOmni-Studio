'use client';

// Error boundary del App Router. Sin este archivo, Next 15 genera un fallback
// del Pages Router que importa <Html> y rompe el build SSG en /404 y /_error.

export const dynamic = 'force-dynamic';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Something went wrong</h1>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
