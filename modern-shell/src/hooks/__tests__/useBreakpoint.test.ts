import { renderHook, act } from '@testing-library/react';
import { useBreakpoint, BREAKPOINTS } from '../useBreakpoint';

describe('useBreakpoint', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    rafCallbacks = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
  });

  function setViewport(width: number, height: number = 768) {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  }

  function flushRAF() {
    const cbs = rafCallbacks.splice(0);
    cbs.forEach((cb) => cb(performance.now()));
  }

  describe('BREAKPOINTS', () => {
    it('should match Angular CDK Material breakpoints', () => {
      expect(BREAKPOINTS.xs).toBe(0);
      expect(BREAKPOINTS.sm).toBe(600);
      expect(BREAKPOINTS.md).toBe(960);
      expect(BREAKPOINTS.lg).toBe(1280);
      expect(BREAKPOINTS.xl).toBe(1920);
    });
  });

  describe('with named breakpoints', () => {
    it('should return true when width >= sm breakpoint', () => {
      setViewport(600);
      const { result } = renderHook(() => useBreakpoint('sm'));
      act(() => { flushRAF(); });
      expect(result.current).toBe(true);
    });

    it('should return false when width < sm breakpoint', () => {
      setViewport(599);
      const { result } = renderHook(() => useBreakpoint('sm'));
      act(() => { flushRAF(); });
      expect(result.current).toBe(false);
    });

    it('should return true when width >= md breakpoint', () => {
      setViewport(960);
      const { result } = renderHook(() => useBreakpoint('md'));
      act(() => { flushRAF(); });
      expect(result.current).toBe(true);
    });

    it('should return false when width < md breakpoint', () => {
      setViewport(959);
      const { result } = renderHook(() => useBreakpoint('md'));
      act(() => { flushRAF(); });
      expect(result.current).toBe(false);
    });

    it('should return true when width >= lg breakpoint', () => {
      setViewport(1280);
      const { result } = renderHook(() => useBreakpoint('lg'));
      act(() => { flushRAF(); });
      expect(result.current).toBe(true);
    });

    it('should return false when width < lg breakpoint', () => {
      setViewport(1279);
      const { result } = renderHook(() => useBreakpoint('lg'));
      act(() => { flushRAF(); });
      expect(result.current).toBe(false);
    });

    it('should return true when width >= xl breakpoint', () => {
      setViewport(1920);
      const { result } = renderHook(() => useBreakpoint('xl'));
      act(() => { flushRAF(); });
      expect(result.current).toBe(true);
    });

    it('should return false when width < xl breakpoint', () => {
      setViewport(1919);
      const { result } = renderHook(() => useBreakpoint('xl'));
      act(() => { flushRAF(); });
      expect(result.current).toBe(false);
    });

    it('should always return true for xs breakpoint', () => {
      setViewport(320);
      const { result } = renderHook(() => useBreakpoint('xs'));
      act(() => { flushRAF(); });
      expect(result.current).toBe(true);
    });
  });

  describe('with custom pixel values', () => {
    it('should accept a custom pixel threshold', () => {
      setViewport(800);
      const { result } = renderHook(() => useBreakpoint(750));
      act(() => { flushRAF(); });
      expect(result.current).toBe(true);
    });

    it('should return false when width < custom threshold', () => {
      setViewport(700);
      const { result } = renderHook(() => useBreakpoint(750));
      act(() => { flushRAF(); });
      expect(result.current).toBe(false);
    });
  });

  describe('responsive updates', () => {
    it('should update when window is resized across a breakpoint', () => {
      setViewport(500);
      const { result } = renderHook(() => useBreakpoint('sm'));

      act(() => { flushRAF(); });
      expect(result.current).toBe(false);

      act(() => {
        setViewport(700);
        window.dispatchEvent(new Event('resize'));
        flushRAF();
      });

      expect(result.current).toBe(true);
    });

    it('should update on orientation change crossing a breakpoint', () => {
      setViewport(1300, 800);
      const { result } = renderHook(() => useBreakpoint('lg'));

      act(() => { flushRAF(); });
      expect(result.current).toBe(true);

      act(() => {
        setViewport(800, 1300);
        window.dispatchEvent(new Event('orientationchange'));
        flushRAF();
      });

      expect(result.current).toBe(false);
    });
  });
});
