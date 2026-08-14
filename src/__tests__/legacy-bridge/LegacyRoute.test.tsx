import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LegacyRoute } from '../../legacy-bridge/LegacyRoute';

afterEach(() => {
  vi.unstubAllEnvs();
});

function renderAtPath(path: string) {
  vi.stubEnv('VITE_LEGACY_ORIGIN', '');
  const router = createMemoryRouter(
    [{ path: '/legacy/*', element: <LegacyRoute /> }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('LegacyRoute', () => {
  it('renders iframe for a known legacy route', () => {
    renderAtPath('/legacy/dashboard');
    const iframe = screen.getByTitle('Dashboard');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', '/legacy-app/dashboard');
  });

  it('renders iframe for settings route', () => {
    renderAtPath('/legacy/settings');
    const iframe = screen.getByTitle('Settings');
    expect(iframe).toHaveAttribute('src', '/legacy-app/settings');
  });

  it('renders iframe for new-expense route', () => {
    renderAtPath('/legacy/new-expense');
    const iframe = screen.getByTitle('New Expense');
    expect(iframe).toHaveAttribute('src', '/legacy-app/new-expense');
  });

  it('shows error for unrecognized legacy path', () => {
    renderAtPath('/legacy/unknown-page');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Legacy route not found')).toBeInTheDocument();
  });
});
