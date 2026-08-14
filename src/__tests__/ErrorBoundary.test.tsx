import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';

function ThrowingComponent({ error }: { error: Error }): never {
  throw error;
}

function GoodComponent() {
  return <div>Working</div>;
}

function ResettableErrorTest({ onReset }: { onReset: () => void }) {
  const [shouldThrow, setShouldThrow] = useState(true);

  return (
    <ErrorBoundary
      onReset={() => {
        setShouldThrow(false);
        onReset();
      }}
    >
      {shouldThrow ? (
        <ThrowingComponent error={new Error('reset test')} />
      ) : (
        <GoodComponent />
      )}
    </ErrorBoundary>
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('renders default error fallback when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent error={new Error('Test crash')} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test crash')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <ThrowingComponent error={new Error('oops')} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent error={new Error('callback test')} />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'callback test' }),
      expect.objectContaining({ componentStack: expect.any(String) as string }),
    );
  });

  it('resets error state when Try Again is clicked', () => {
    const onReset = vi.fn();
    render(<ResettableErrorTest onReset={onReset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try Again'));
    expect(onReset).toHaveBeenCalledOnce();
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('provides Go Home button that navigates to root', () => {
    const originalHref = window.location.href;
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent error={new Error('nav test')} />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText('Go Home'));
    expect(window.location.href).toBe('/');
  });

  it('does not unmount sibling components on error', () => {
    render(
      <div>
        <div data-testid="sibling">I survive</div>
        <ErrorBoundary>
          <ThrowingComponent error={new Error('isolated')} />
        </ErrorBoundary>
      </div>,
    );
    expect(screen.getByTestId('sibling')).toBeInTheDocument();
    expect(screen.getByText('I survive')).toBeInTheDocument();
  });
});
