import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotificationProvider, useNotification } from '../NotificationProvider';

function TestConsumer() {
  const { showSuccess, showError } = useNotification();
  return (
    <div>
      <button onClick={() => showSuccess('Saved!')}>Success</button>
      <button onClick={() => showError('Something went wrong')}>Error</button>
    </div>
  );
}

describe('NotificationProvider', () => {
  it('should render children', () => {
    render(
      <NotificationProvider>
        <span>Hello</span>
      </NotificationProvider>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should show success notification', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    act(() => {
      screen.getByText('Success').click();
    });

    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('should show error notification', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    act(() => {
      screen.getByText('Error').click();
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should throw when useNotification is used outside provider', () => {
    function Orphan() {
      useNotification();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      'useNotification must be used within a NotificationProvider',
    );
  });
});
