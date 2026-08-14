import { type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { findLegacyRoute } from './route-registry';
import { LegacyFrame } from './LegacyFrame';
import { buildLegacyUrl } from './legacy-url';

export function LegacyRoute(): ReactNode {
  const { '*': splat } = useParams();
  const path = splat ?? '';
  const route = findLegacyRoute(path);

  if (!route) {
    return (
      <div role="alert" style={styles.container}>
        <h2 style={styles.heading}>Legacy route not found</h2>
        <p style={styles.message}>
          The path <code>/{path}</code> is not a recognized legacy route.
        </p>
      </div>
    );
  }

  const src = buildLegacyUrl(route.path);

  return <LegacyFrame src={src} title={route.title} />;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '2rem',
    gap: '0.5rem',
  },
  heading: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  message: {
    color: '#666',
    fontSize: '0.875rem',
  },
} as const;
