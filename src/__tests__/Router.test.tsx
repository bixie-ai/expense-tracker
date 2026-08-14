import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Suspense, lazy, type ReactNode } from 'react';
import { RouteErrorBoundary } from '../components/RouteErrorBoundary';
import { LoadingSpinner } from '../components/LoadingSpinner';

function SuspenseRoute({ children }: { children: ReactNode }): ReactNode {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

const Dashboard = lazy(() => import('../routes/migrated/Dashboard'));
const Settings = lazy(() => import('../routes/migrated/Settings'));
const LegacyPlaceholder = lazy(
  () => import('../routes/legacy/LegacyPlaceholder'),
);
const NotFound = lazy(() => import('../routes/NotFound'));

function renderWithRouter(initialRoute: string) {
  const routes = [
    {
      path: '/',
      element: (
        <SuspenseRoute>
          <Dashboard />
        </SuspenseRoute>
      ),
    },
    {
      path: '/settings',
      element: (
        <SuspenseRoute>
          <Settings />
        </SuspenseRoute>
      ),
    },
    {
      path: '/legacy/*',
      element: (
        <SuspenseRoute>
          <LegacyPlaceholder />
        </SuspenseRoute>
      ),
    },
    {
      path: '*',
      element: (
        <SuspenseRoute>
          <NotFound />
        </SuspenseRoute>
      ),
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: [initialRoute],
  });

  return render(<RouterProvider router={router} />);
}

describe('Router', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders Dashboard at root path', async () => {
    renderWithRouter('/');
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('renders Settings at /settings path', async () => {
    renderWithRouter('/settings');
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('renders LegacyPlaceholder for /legacy/* paths', async () => {
    renderWithRouter('/legacy/expenses');
    await waitFor(() => {
      expect(screen.getByText('Legacy Route')).toBeInTheDocument();
      expect(screen.getByText(/expenses/)).toBeInTheDocument();
    });
  });

  it('renders NotFound for unknown paths', async () => {
    renderWithRouter('/nonexistent');
    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page not found')).toBeInTheDocument();
    });
  });

  it('renders LoadingSpinner component correctly', () => {
    render(<LoadingSpinner />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('wraps routes in error boundaries for isolation', async () => {
    const FailingLazy = lazy(
      () =>
        new Promise<{ default: () => never }>((resolve) => {
          resolve({
            default: () => {
              throw new Error('route crash');
            },
          });
        }),
    );

    const routes = [
      {
        path: '/',
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <FailingLazy />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
    ];

    const router = createMemoryRouter(routes, {
      initialEntries: ['/'],
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText('This section encountered an error.'),
      ).toBeInTheDocument();
    });
  });
});
