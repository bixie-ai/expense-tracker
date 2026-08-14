import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LegacyRedirect } from '../../legacy-bridge/LegacyRedirect';
import { LegacyRoute } from '../../legacy-bridge/LegacyRoute';

function renderWithRoutes(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/legacy/*',
        element: <LegacyRoute />,
      },
      {
        path: '*',
        element: (
          <>
            <LegacyRedirect />
            <div data-testid="not-found">Not Found</div>
          </>
        ),
      },
    ],
    { initialEntries: [initialPath] },
  );
  return render(<RouterProvider router={router} />);
}

describe('LegacyRedirect', () => {
  it('redirects /dashboard to /legacy/dashboard', () => {
    renderWithRoutes('/dashboard');
    expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
  });

  it('redirects /login to /legacy/login', () => {
    renderWithRoutes('/login');
    expect(screen.getByTitle('Login')).toBeInTheDocument();
  });

  it('redirects /new-expense to /legacy/new-expense', () => {
    renderWithRoutes('/new-expense');
    expect(screen.getByTitle('New Expense')).toBeInTheDocument();
  });

  it('does not redirect for unknown paths', () => {
    renderWithRoutes('/some-random-path');
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });
});
