/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from 'react';
import {
  createBrowserRouter,
  type RouteObject,
} from 'react-router-dom';
import { Shell } from './Shell';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LegacyRoute } from './legacy-bridge/LegacyRoute';
import { LegacyRedirect } from './legacy-bridge/LegacyRedirect';

const Dashboard = lazy(() => import('./routes/migrated/Dashboard'));
const Settings = lazy(() => import('./routes/migrated/Settings'));
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
      <RouteErrorBoundary>
        <LegacyRoute />
      </RouteErrorBoundary>
    ),
  },
];

function LegacyFallback(): ReactNode {
  return (
    <>
      <LegacyRedirect />
      <NotFound />
    </>
  );
}

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
            <LegacyFallback />
          </SuspenseRoute>
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
