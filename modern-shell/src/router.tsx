import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouteObject,
} from 'react-router-dom';
import { ErrorBoundary, SuspenseFallback } from './components';
import { getLegacyRoutes, getMigratedRoutes } from './config';
import type { RouteEntry } from './config';

const LegacyBridge = lazy(() =>
  import('./components/LegacyBridge').then((m) => ({ default: m.LegacyBridge }))
);

const LayoutComponent = lazy(() =>
  import('./components/Layout').then((m) => ({ default: m.LayoutComponent }))
);

const Home = lazy(() =>
  import('./pages/Home').then((m) => ({ default: m.Home }))
);

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);

const ExpenseForm = lazy(() =>
  import('./components/expenses/ExpenseForm').then((m) => ({ default: m.ExpenseForm }))
);

const migratedComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'log-expense': ExpenseForm,
};

function isFeatureEnabled(flag?: string): boolean {
  if (!flag) return true;
  return import.meta.env[`VITE_FF_${flag.toUpperCase()}`] === 'true';
}

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
  return getMigratedRoutes()
    .filter((entry: RouteEntry) => isFeatureEnabled(entry.featureFlag))
    .map((entry: RouteEntry) => {
      const Component = migratedComponents[entry.path] ?? Home;
      return {
        path: entry.path,
        element: (
          <ErrorBoundary>
            <Suspense fallback={<SuspenseFallback />}>
              <Component />
            </Suspense>
          </ErrorBoundary>
        ),
      };
    });
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

function buildLayoutRoute(): RouteObject {
  const useLayout = isFeatureEnabled('layout_component_v2');

  if (!useLayout) {
    return {
      children: [
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
      ],
    };
  }

  return {
    element: (
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <LayoutComponent />
        </Suspense>
      </ErrorBoundary>
    ),
    children: [
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
    ],
  };
}

export const router = createBrowserRouter([
  buildLayoutRoute(),
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <LoginPage />
        </Suspense>
      </ErrorBoundary>
    ),
  },
]);
