import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import { LayoutProvider, useLayout } from '../contexts/LayoutContext';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';

const DRAWER_WIDTH = 220;
const COMPACT_DRAWER_WIDTH = 80;

function LayoutShell() {
  const { sidebarOpen, compactMode, isHandset } = useLayout();

  const marginLeft = isHandset
    ? 0
    : sidebarOpen
      ? compactMode
        ? `${COMPACT_DRAWER_WIDTH}px`
        : `${DRAWER_WIDTH}px`
      : 0;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft,
          transition: 'margin-left 0.2s ease-in-out',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            height: 'calc(100dvh - 64px)',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export function LayoutComponent() {
  return (
    <LayoutProvider>
      <LayoutShell />
    </LayoutProvider>
  );
}
