'use client';

/**
 * Last-resort error boundary: catches errors thrown in the ROOT layout itself
 * (everything below is covered by app/[locale]/error.tsx). Replaces the root
 * layout when triggered, so it must render its own <html>/<body> and cannot
 * rely on globals.css, next-intl or any provider — hence inline styles and
 * untranslated copy.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#0b1120',
          color: '#e2e8f0',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <p style={{ fontSize: '2rem', margin: 0 }}>🎢</p>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Something went wrong</h1>
        <p style={{ margin: 0, color: '#94a3b8', maxWidth: '28rem' }}>
          An unexpected error occurred. Please try again — if the problem persists, park.fan will be
          back shortly.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#e2e8f0',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
