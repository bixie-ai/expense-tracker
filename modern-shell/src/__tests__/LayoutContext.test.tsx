import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LayoutProvider, useLayout } from '../contexts/LayoutContext';

vi.mock('../hooks/useBreakpoint', () => ({
  useBreakpoint: vi.fn(() => true),
}));

import { useBreakpoint } from '../hooks/useBreakpoint';

function TestConsumer() {
  const { sidebarOpen, compactMode, isHandset, toggleSidebar, toggleCompactMode } = useLayout();
  return (
    <div>
      <span data-testid="sidebar-open">{String(sidebarOpen)}</span>
      <span data-testid="compact-mode">{String(compactMode)}</span>
      <span data-testid="is-handset">{String(isHandset)}</span>
      <button onClick={toggleSidebar}>toggle-sidebar</button>
      <button onClick={toggleCompactMode}>toggle-compact</button>
    </div>
  );
}

describe('LayoutContext', () => {
  it('provides default values for desktop', () => {
    vi.mocked(useBreakpoint).mockReturnValue(true);
    render(
      <LayoutProvider>
        <TestConsumer />
      </LayoutProvider>
    );
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('true');
    expect(screen.getByTestId('compact-mode')).toHaveTextContent('false');
    expect(screen.getByTestId('is-handset')).toHaveTextContent('false');
  });

  it('provides handset mode when below breakpoint', () => {
    vi.mocked(useBreakpoint).mockReturnValue(false);
    render(
      <LayoutProvider>
        <TestConsumer />
      </LayoutProvider>
    );
    expect(screen.getByTestId('is-handset')).toHaveTextContent('true');
  });

  it('toggles sidebar state', () => {
    vi.mocked(useBreakpoint).mockReturnValue(true);
    render(
      <LayoutProvider>
        <TestConsumer />
      </LayoutProvider>
    );
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('true');
    act(() => {
      screen.getByText('toggle-sidebar').click();
    });
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('false');
  });

  it('toggles compact mode', () => {
    vi.mocked(useBreakpoint).mockReturnValue(true);
    render(
      <LayoutProvider>
        <TestConsumer />
      </LayoutProvider>
    );
    expect(screen.getByTestId('compact-mode')).toHaveTextContent('false');
    act(() => {
      screen.getByText('toggle-compact').click();
    });
    expect(screen.getByTestId('compact-mode')).toHaveTextContent('true');
  });

  it('throws when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useLayout must be used within a LayoutProvider'
    );
    consoleSpy.mockRestore();
  });
});
