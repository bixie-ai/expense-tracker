const DEFAULT_LEGACY_ORIGIN = '/legacy-app';

export function getLegacyOrigin(): string {
  const envOrigin = import.meta.env.VITE_LEGACY_ORIGIN as string | undefined;
  return envOrigin || DEFAULT_LEGACY_ORIGIN;
}

export function buildLegacyUrl(path: string): string {
  const origin = getLegacyOrigin();
  const normalizedPath = path.replace(/^\/+/, '');
  return `${origin}/${normalizedPath}`;
}
