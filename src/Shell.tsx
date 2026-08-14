import { type ReactNode } from 'react';
import { Outlet, Link } from 'react-router-dom';

export function Shell(): ReactNode {
  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <nav style={styles.nav}>
          <Link to="/" style={styles.brand}>
            Expense Tracker
          </Link>
          <div style={styles.links}>
            <Link to="/" style={styles.link}>Dashboard</Link>
            <Link to="/settings" style={styles.link}>Settings</Link>
            <Link to="/legacy/expenses" style={styles.link}>Legacy</Link>
          </div>
        </nav>
      </header>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
  },
  header: {
    borderBottom: '1px solid #e5e7eb',
    padding: '0 1rem',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  brand: {
    fontWeight: 700,
    fontSize: '1.125rem',
    color: '#111827',
    textDecoration: 'none',
  },
  links: {
    display: 'flex',
    gap: '1.5rem',
  },
  link: {
    color: '#4b5563',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
  main: {
    flex: 1,
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
} as const;
