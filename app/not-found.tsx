import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', marginTop: '1rem' }}>
            Page Not Found
          </h2>
          <p style={{ marginTop: '1rem', color: '#666' }}>
            The page you are looking for does not exist.
          </p>
          <Link
            href="/"
            prefetch={false}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              background: '#0070f3',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
            }}
          >
            Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}
