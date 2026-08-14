export interface LegacyRouteEntry {
  path: string;
  title: string;
}

const LEGACY_ROUTES: ReadonlyArray<LegacyRouteEntry> = [
  { path: 'login', title: 'Login' },
  { path: 'dashboard', title: 'Dashboard' },
  { path: 'settings', title: 'Settings' },
  { path: 'new-expense', title: 'New Expense' },
  { path: 'import-expenses', title: 'Import Expenses' },
];

export function getLegacyRoutes(): ReadonlyArray<LegacyRouteEntry> {
  return LEGACY_ROUTES;
}

export function isLegacyRoute(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return LEGACY_ROUTES.some((route) => normalized === route.path);
}

export function findLegacyRoute(pathname: string): LegacyRouteEntry | undefined {
  const normalized = normalizePath(pathname);
  return LEGACY_ROUTES.find((route) => normalized === route.path);
}

function normalizePath(pathname: string): string {
  return pathname.replace(/^\/+/, '').replace(/\/+$/, '');
}
