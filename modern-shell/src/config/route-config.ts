export type RouteStatus = 'legacy' | 'migrated';

export interface RouteEntry {
  path: string;
  status: RouteStatus;
  angularPath?: string;
}

export const routeConfig: ReadonlyArray<RouteEntry> = [
  { path: 'login', status: 'legacy', angularPath: '/login' },
  { path: 'dashboard', status: 'legacy', angularPath: '/dashboard' },
  { path: 'settings', status: 'legacy', angularPath: '/settings' },
  { path: 'new-expense', status: 'legacy', angularPath: '/new-expense' },
  { path: 'import-expenses', status: 'legacy', angularPath: '/import-expenses' },
];

export function getLegacyRoutes(): ReadonlyArray<RouteEntry> {
  return routeConfig.filter((route) => route.status === 'legacy');
}

export function getMigratedRoutes(): ReadonlyArray<RouteEntry> {
  return routeConfig.filter((route) => route.status === 'migrated');
}

export function isLegacyRoute(path: string): boolean {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return routeConfig.some(
    (route) => route.path === normalized && route.status === 'legacy'
  );
}

export function getAngularPath(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const entry = routeConfig.find((route) => route.path === normalized);
  return entry?.angularPath ?? `/${normalized}`;
}

export const ANGULAR_BASE_URL =
  import.meta.env.VITE_ANGULAR_BASE_URL ?? 'http://localhost:4201';
