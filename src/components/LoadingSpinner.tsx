import { type ReactNode } from 'react';

export function LoadingSpinner(): ReactNode {
  return (
    <div style={styles.container} aria-label="Loading">
      <div style={styles.spinner} />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    minHeight: '200px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
} as const;
