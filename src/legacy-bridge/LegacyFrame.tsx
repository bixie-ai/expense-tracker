import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface LegacyFrameProps {
  src: string;
  title: string;
}

export function LegacyFrame({ src, title }: LegacyFrameProps): ReactNode {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [src]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onError = () => setLoadError(true);
    iframe.addEventListener('error', onError);
    return () => iframe.removeEventListener('error', onError);
  });

  if (loadError) {
    return (
      <div role="alert" style={styles.errorContainer}>
        <h2 style={styles.errorHeading}>Legacy route unavailable</h2>
        <p style={styles.errorMessage}>
          The Angular application at <code>{src}</code> could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div role="alert" style={styles.errorContainer}>
          <h2 style={styles.errorHeading}>Legacy bridge error</h2>
          <p style={styles.errorMessage}>Failed to render the legacy route frame.</p>
        </div>
      }
    >
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        style={styles.iframe}
      />
    </ErrorBoundary>
  );
}

const styles = {
  iframe: {
    width: '100%',
    height: 'calc(100vh - 56px)',
    border: 'none',
    display: 'block',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '2rem',
    gap: '0.5rem',
  },
  errorHeading: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  errorMessage: {
    color: '#666',
    fontSize: '0.875rem',
  },
} as const;
