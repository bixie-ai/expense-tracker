import { renderHook, act } from '@testing-library/react';
import { useWindowSize } from '../useWindowSize';

describe('useWindowSize', () => {
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
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
  });

  function flushRAF() {
    const cbs = rafCallbacks.splice(0);
    cbs.forEach((cb) => cb(performance.now()));
  }

  it('should return initial window dimensions after mount', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      flushRAF();
    });

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('should return { width: 0, height: 0 } before first RAF fires', () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width).toBe(0);
    expect(result.current.height).toBe(0);
  });

  it('should update on window resize', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      flushRAF();
    });

    expect(result.current.width).toBe(1024);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });
      window.dispatchEvent(new Event('resize'));
      flushRAF();
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
  });

  it('should update on orientationchange', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      flushRAF();
    });

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 });
      window.dispatchEvent(new Event('orientationchange'));
      flushRAF();
    });

    expect(result.current.width).toBe(768);
    expect(result.current.height).toBe(1024);
  });

  it('should debounce rapid resize events via requestAnimationFrame', () => {
    renderHook(() => useWindowSize());

    act(() => {
      flushRAF();
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
    });

    expect(rafCallbacks.length).toBe(1);
  });

  it('should clean up listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    act(() => {
      flushRAF();
    });

    unmount();

    const removedEvents = removeSpy.mock.calls.map((call) => call[0]);
    expect(removedEvents).toContain('resize');
    expect(removedEvents).toContain('orientationchange');
  });

  it('should cancel pending RAF on unmount', () => {
    const cancelSpy = vi.mocked(window.cancelAnimationFrame);
    const { unmount } = renderHook(() => useWindowSize());

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
