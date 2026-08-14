import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function NotFound(): ReactNode {
  return (
    <div style={styles.container}>
      <h1>404</h1>
      <p>Page not found</p>
      <Link to="/" style={styles.link}>
        Go to Dashboard
      </Link>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    minHeight: '50vh',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
} as const;
