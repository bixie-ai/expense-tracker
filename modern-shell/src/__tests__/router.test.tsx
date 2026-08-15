import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { router } from '../router';

vi.stubEnv('VITE_ANGULAR_BASE_URL', 'http://localhost:4201');

function renderRouter(initialPath: string) {
  const testRouter = createMemoryRouter(router.routes, {
    initialEntries: [initialPath],
  });
  return render(<RouterProvider router={testRouter} />);
}

describe('router', () => {
  it('renders home page at /', async () => {
    renderRouter('/');
    await waitFor(() => {
      expect(screen.getByText('Expense Tracker')).toBeInTheDocument();
    });
  });

  it('renders legacy bridge for /dashboard', async () => {
    renderRouter('/dashboard');
    await waitFor(() => {
      expect(screen.getByTestId('legacy-bridge-iframe')).toBeInTheDocument();
    });
  });

  it('renders legacy bridge for /settings', async () => {
    renderRouter('/settings');
    await waitFor(() => {
      expect(screen.getByTestId('legacy-bridge-iframe')).toBeInTheDocument();
    });
  });

  it('renders legacy bridge for unknown routes via catch-all', async () => {
    renderRouter('/some-unknown-route');
    await waitFor(() => {
      expect(screen.getByTestId('legacy-bridge-iframe')).toBeInTheDocument();
    });
  });

  it('catch-all iframe points to correct Angular URL', async () => {
    renderRouter('/some-unknown-route');
    await waitFor(() => {
      const iframe = screen.getByTestId('legacy-bridge-iframe');
      expect(iframe).toHaveAttribute(
        'src',
        'http://localhost:4201/some-unknown-route'
      );
    });
  });
});
