import { type ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps): ReactNode {
  return (
    <ErrorBoundary
      fallback={<RouteErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
}

function RouteErrorFallback(): ReactNode {
  return (
    <div role="alert" style={styles.container}>
      <p style={styles.message}>This section encountered an error.</p>
      <button
        onClick={() => { window.location.reload(); }}
        style={styles.button}
      >
        Reload Page
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '2rem',
    gap: '1rem',
  },
  message: {
    color: '#666',
    fontSize: '0.875rem',
  },
  button: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
} as const;
