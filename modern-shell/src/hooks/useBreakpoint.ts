import { useWindowSize } from './useWindowSize';

export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export function useBreakpoint(breakpoint: BreakpointKey | number): boolean {
  const { width } = useWindowSize();
  const threshold = typeof breakpoint === 'number' ? breakpoint : BREAKPOINTS[breakpoint];
  return width >= threshold;
}
