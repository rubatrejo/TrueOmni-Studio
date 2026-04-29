'use client';

// Global error boundary del App Router. Necesario en Next 15 para evitar que
// el build SSG intente prerender /404 a través del shell legacy de pages/_document
// (que arrastra <Html>, incompatible fuera de pages/).

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
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
      </body>
    </html>
  );
}
