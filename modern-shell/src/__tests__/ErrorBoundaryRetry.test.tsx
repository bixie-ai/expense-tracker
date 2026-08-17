import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../components/ErrorBoundary';
import React from 'react';

function AlwaysThrows(): React.ReactNode {
  throw new Error('Permanent failure');
}

describe('ErrorBoundary with Retry', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Retry button in default fallback', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Retry')).toBeInTheDocument();
  });

  it('re-renders children when Retry is clicked', async () => {
    const user = userEvent.setup();

    let shouldThrow = true;
    function ThrowConditionally(): React.ReactNode {
      if (shouldThrow) {
        throw new Error('Conditional error');
      }
      return <p>Content after retry</p>;
    }

    render(
      <ErrorBoundary>
        <ThrowConditionally />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Conditional error')).toBeInTheDocument();
    shouldThrow = false;
    await user.click(screen.getByLabelText('Retry'));
    expect(screen.getByText('Content after retry')).toBeInTheDocument();
  });

  it('shows error message text', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Permanent failure')).toBeInTheDocument();
  });
});
