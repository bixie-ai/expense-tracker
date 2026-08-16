import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { LayoutProvider } from '../contexts/LayoutContext';

vi.mock('../hooks/useBreakpoint', () => ({
  useBreakpoint: vi.fn(() => true),
}));

import { useBreakpoint } from '../hooks/useBreakpoint';

function renderSidebar(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LayoutProvider>
        <Sidebar />
      </LayoutProvider>
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(useBreakpoint).mockReturnValue(true);
  });

  it('renders navigation links', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Import Expenses')).toBeInTheDocument();
  });

  it('renders links as React Router Link components with correct paths', () => {
    renderSidebar();
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/settings');
    const importLink = screen.getByText('Import Expenses').closest('a');
    expect(importLink).toHaveAttribute('href', '/import-expenses');
  });

  it('highlights the active route', () => {
    renderSidebar('/dashboard');
    const dashboardButton = screen.getByText('Dashboard').closest('[role="button"]') ||
      screen.getByText('Dashboard').closest('a');
    expect(dashboardButton).toHaveClass('Mui-selected');
  });

  it('shows app title in persistent drawer on desktop', () => {
    renderSidebar();
    expect(screen.getByText('Expense Tracker')).toBeInTheDocument();
  });

  it('shows "Menu" title on handset', () => {
    vi.mocked(useBreakpoint).mockReturnValue(false);
    renderSidebar();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('renders toggle compact button on desktop', () => {
    renderSidebar();
    expect(screen.getByLabelText('Toggle compact menu')).toBeInTheDocument();
  });

  it('does not render toggle compact button on handset', () => {
    vi.mocked(useBreakpoint).mockReturnValue(false);
    renderSidebar();
    expect(screen.queryByLabelText('Toggle compact menu')).not.toBeInTheDocument();
  });

  it('hides nav text in compact mode', () => {
    renderSidebar();
    act(() => {
      screen.getByLabelText('Toggle compact menu').click();
    });
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('renders footer links in expanded mode', () => {
    renderSidebar();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
  });

  it('hides footer links in compact mode', () => {
    renderSidebar();
    act(() => {
      screen.getByLabelText('Toggle compact menu').click();
    });
    expect(screen.queryByLabelText('LinkedIn')).not.toBeInTheDocument();
  });

  it('has navigation aria-label', () => {
    renderSidebar();
    expect(screen.getByLabelText('Navigation drawer')).toBeInTheDocument();
  });
});
