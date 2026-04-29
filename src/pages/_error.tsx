// Minimal _error para Pages Router. El kiosk usa App Router; los errores
// reales se gestionan en `src/app/error.tsx`, `src/app/global-error.tsx` y
// `src/app/not-found.tsx`. Este archivo solo evita que Next 15 genere su
// propio _error fallback que rompe el SSG.

import type { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
}

function ErrorPage({ statusCode }: ErrorProps) {
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
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
          {statusCode ?? 'Error'}
        </h1>
        <p style={{ fontSize: '14px' }}>
          {statusCode === 404 ? 'Page not found' : 'Something went wrong'}
        </p>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
