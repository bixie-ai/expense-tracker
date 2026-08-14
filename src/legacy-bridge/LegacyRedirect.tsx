import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLegacyRoute } from './route-registry';

export function LegacyRedirect(): ReactNode {
  const location = useLocation();

  if (isLegacyRoute(location.pathname)) {
    const normalized = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    return <Navigate to={`/legacy/${normalized}`} replace />;
  }

  return null;
}
