/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from 'react';
import {
  createBrowserRouter,
  type RouteObject,
} from 'react-router-dom';
import { Shell } from './Shell';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';

const Dashboard = lazy(() => import('./routes/migrated/Dashboard'));
const Settings = lazy(() => import('./routes/migrated/Settings'));
const LegacyPlaceholder = lazy(() => import('./routes/legacy/LegacyPlaceholder'));
const NotFound = lazy(() => import('./routes/NotFound'));

function SuspenseRoute({ children }: { children: ReactNode }): ReactNode {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}

const migratedRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <SuspenseRoute>
        <Dashboard />
      </SuspenseRoute>
    ),
  },
  {
    path: 'settings',
    element: (
      <SuspenseRoute>
        <Settings />
      </SuspenseRoute>
    ),
  },
];

const legacyRoutes: RouteObject[] = [
  {
    path: 'legacy/*',
    element: (
      <SuspenseRoute>
        <LegacyPlaceholder />
      </SuspenseRoute>
    ),
  },
];

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Shell />,
    children: [
      ...migratedRoutes,
      ...legacyRoutes,
      {
        path: '*',
        element: (
          <SuspenseRoute>
            <NotFound />
          </SuspenseRoute>
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
