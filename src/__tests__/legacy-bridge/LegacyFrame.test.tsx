import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LegacyFrame } from '../../legacy-bridge/LegacyFrame';

describe('LegacyFrame', () => {
  it('renders an iframe with the correct src and title', () => {
    render(<LegacyFrame src="/legacy-app/dashboard" title="Dashboard" />);
    const iframe = screen.getByTitle('Dashboard');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', '/legacy-app/dashboard');
  });

  it('renders iframe filling available space', () => {
    render(<LegacyFrame src="/legacy-app/settings" title="Settings" />);
    const iframe = screen.getByTitle('Settings');
    expect(iframe).toHaveStyle({ width: '100%', display: 'block' });
  });

  it('shows error state when error event fires on iframe', () => {
    render(<LegacyFrame src="/legacy-app/broken" title="Broken" />);
    const iframe = screen.getByTitle('Broken');

    act(() => {
      iframe.dispatchEvent(new Event('error', { bubbles: false }));
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Legacy route unavailable')).toBeInTheDocument();
  });

  it('resets error state when src changes', () => {
    const { rerender } = render(<LegacyFrame src="/legacy-app/broken" title="Broken" />);
    const iframe = screen.getByTitle('Broken');

    act(() => {
      iframe.dispatchEvent(new Event('error', { bubbles: false }));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<LegacyFrame src="/legacy-app/dashboard" title="Dashboard" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
  });
});
