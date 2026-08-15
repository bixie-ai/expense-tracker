import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouteObject,
} from 'react-router-dom';
import { ErrorBoundary, SuspenseFallback } from './components';
import { getLegacyRoutes, getMigratedRoutes } from './config';

const LegacyBridge = lazy(() =>
  import('./components/LegacyBridge').then((m) => ({ default: m.LegacyBridge }))
);

const Home = lazy(() =>
  import('./pages/Home').then((m) => ({ default: m.Home }))
);

function buildLegacyRoutes(): RouteObject[] {
  return getLegacyRoutes().map((entry) => ({
    path: entry.path,
    element: (
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <LegacyBridge />
        </Suspense>
      </ErrorBoundary>
    ),
  }));
}

function buildMigratedRoutes(): RouteObject[] {
  return getMigratedRoutes().map((entry) => ({
    path: entry.path,
    element: (
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <Home />
        </Suspense>
      </ErrorBoundary>
    ),
  }));
}

const legacyCatchAll: RouteObject = {
  path: '*',
  element: (
    <ErrorBoundary>
      <Suspense fallback={<SuspenseFallback />}>
        <LegacyBridge />
      </Suspense>
    </ErrorBoundary>
  ),
};

export const router = createBrowserRouter([
  ...buildMigratedRoutes(),
  ...buildLegacyRoutes(),
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <Home />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  legacyCatchAll,
]);
