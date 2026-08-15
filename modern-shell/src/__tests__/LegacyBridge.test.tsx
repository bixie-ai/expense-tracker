import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LegacyBridge } from '../components/LegacyBridge';

vi.stubEnv('VITE_ANGULAR_BASE_URL', 'http://localhost:4201');

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<LegacyBridge />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LegacyBridge', () => {
  it('renders an iframe targeting the Angular app', () => {
    renderWithRouter('/dashboard');
    const iframe = screen.getByTestId('legacy-bridge-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      'http://localhost:4201/dashboard'
    );
  });

  it('builds correct src for routes with query params', () => {
    renderWithRouter('/settings?tab=categories');
    const iframe = screen.getByTestId('legacy-bridge-iframe');
    expect(iframe).toHaveAttribute(
      'src',
      'http://localhost:4201/settings?tab=categories'
    );
  });

  it('builds correct src for routes with hash', () => {
    renderWithRouter('/dashboard#summary');
    const iframe = screen.getByTestId('legacy-bridge-iframe');
    expect(iframe).toHaveAttribute(
      'src',
      'http://localhost:4201/dashboard#summary'
    );
  });

  it('has accessible title attribute on the iframe', () => {
    renderWithRouter('/new-expense');
    const iframe = screen.getByTestId('legacy-bridge-iframe');
    expect(iframe).toHaveAttribute('title', 'Legacy route: /new-expense');
  });

  it('renders with full-viewport styles', () => {
    renderWithRouter('/dashboard');
    const iframe = screen.getByTestId('legacy-bridge-iframe');
    expect(iframe).toHaveStyle({
      width: '100%',
      height: '100%',
      position: 'absolute',
      borderStyle: 'none',
    });
  });
});
