import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LayoutComponent } from '../components/Layout';

vi.mock('../hooks/useBreakpoint', () => ({
  useBreakpoint: vi.fn(() => true),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    userDetails: { firstName: 'Jane', lastName: 'Smith' },
    loading: false,
    error: null,
    logIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    setUserDetails: vi.fn(),
  }),
}));

function ChildRoute() {
  return <div data-testid="child-content">Child Route Content</div>;
}

function renderLayout(initialPath = '/') {
  const router = createMemoryRouter(
    [
      {
        element: <LayoutComponent />,
        children: [
          { path: '/', element: <ChildRoute /> },
          { path: '/dashboard', element: <div data-testid="dashboard">Dashboard</div> },
        ],
      },
    ],
    { initialEntries: [initialPath] }
  );
  return render(<RouterProvider router={router} />);
}

describe('LayoutComponent', () => {
  it('renders child routes inside the layout', () => {
    renderLayout('/');
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders the sidebar', () => {
    renderLayout('/');
    expect(screen.getByLabelText('Navigation drawer')).toBeInTheDocument();
  });

  it('renders the toolbar with user name', () => {
    renderLayout('/');
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders navigation links in sidebar', () => {
    renderLayout('/');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toHaveTextContent('Dashboard');
    expect(nav).toHaveTextContent('Settings');
    expect(nav).toHaveTextContent('Import Expenses');
  });

  it('renders different child routes correctly', () => {
    renderLayout('/dashboard');
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('renders a main element for content area', () => {
    const { container } = renderLayout('/');
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
