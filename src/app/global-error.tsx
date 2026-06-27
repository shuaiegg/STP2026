'use client';

// global-error runs outside all providers (replaces the root <html>/<body>), so CSS
// custom properties (brand tokens) are not loaded yet. Inline colors here are the
// documented exception to the brand-token rule — do not replace with Tailwind brand-*
// classes, they will have no effect in this context.

import { useEffect } from 'react';

const COPY = {
  title: 'Something went wrong',
  description: 'We ran into an unexpected problem. Please try again.',
  descriptionZh: '出现了意外问题，请重试。',
  retry: '↺ Try Again',
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f8f9fa',
          color: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          role="alert"
          style={{
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '480px',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#ef4444',
              fontSize: 32,
            }}
            aria-hidden="true"
          >
            ⚠
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {COPY.title}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            {COPY.description}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2rem' }}>
            {COPY.descriptionZh}
          </p>
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.5rem',
              background: '#00d4ff',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {COPY.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
