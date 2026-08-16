import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';

interface LayoutContextType {
  sidebarOpen: boolean;
  compactMode: boolean;
  isHandset: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCompactMode: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const MOBILE_BREAKPOINT = 768;

export function LayoutProvider({ children }: { children: ReactNode }) {
  const isDesktop = useBreakpoint(MOBILE_BREAKPOINT);
  const isHandset = !isDesktop;
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [compactMode, setCompactMode] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const toggleCompactMode = useCallback(() => {
    setCompactMode((prev) => !prev);
  }, []);

  const value: LayoutContextType = {
    sidebarOpen,
    compactMode,
    isHandset,
    toggleSidebar,
    setSidebarOpen,
    toggleCompactMode,
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
