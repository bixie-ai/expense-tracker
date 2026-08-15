import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ErrorBoundary } from './components';

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
