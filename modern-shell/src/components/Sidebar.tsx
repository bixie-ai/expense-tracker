import { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import { useLayout } from '../contexts/LayoutContext';
import { Footer } from './Footer';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
] as const;

const SECONDARY_NAV_ITEMS = [
  { path: '/import-expenses', label: 'Import Expenses', icon: <UploadFileIcon /> },
] as const;

const DRAWER_WIDTH = 220;
const COMPACT_DRAWER_WIDTH = 80;

export function Sidebar() {
  const { sidebarOpen, compactMode, isHandset, setSidebarOpen, toggleCompactMode } =
    useLayout();
  const location = useLocation();

  const handleNavClick = useCallback(() => {
    if (isHandset) {
      setSidebarOpen(false);
    }
  }, [isHandset, setSidebarOpen]);

  const drawerWidth = compactMode ? COMPACT_DRAWER_WIDTH : DRAWER_WIDTH;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          px: 1,
          minHeight: '64px !important',
          justifyContent: compactMode ? 'center' : 'space-between',
        }}
      >
        {!compactMode && (
          <Typography variant="h6" noWrap sx={{ fontWeight: 300 }}>
            {isHandset ? 'Menu' : 'Expense Tracker'}
          </Typography>
        )}
        {!isHandset && (
          <IconButton onClick={toggleCompactMode} size="small" aria-label="Toggle compact menu">
            {compactMode ? <ReadMoreIcon /> : <MenuOpenIcon />}
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List component="nav" sx={{ px: 1, py: 1, flex: 1 }} aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={handleNavClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.dark',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: compactMode ? 'auto' : 40 }}>
              {item.icon}
            </ListItemIcon>
            {!compactMode && <ListItemText primary={item.label} />}
          </ListItemButton>
        ))}
        <Divider sx={{ my: 1 }} />
        {SECONDARY_NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={handleNavClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.dark',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: compactMode ? 'auto' : 40 }}>
              {item.icon}
            </ListItemIcon>
            {!compactMode && <ListItemText primary={item.label} />}
          </ListItemButton>
        ))}
      </List>
      {!compactMode && (
        <Box sx={{ p: 1 }}>
          <Footer />
        </Box>
      )}
    </Box>
  );

  if (isHandset) {
    return (
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        aria-label="Navigation drawer"
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      open={sidebarOpen}
      sx={{
        width: sidebarOpen ? drawerWidth : 0,
        flexShrink: 0,
        transition: 'width 0.2s ease-in-out',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.2s ease-in-out',
        },
      }}
      aria-label="Navigation drawer"
    >
      {drawerContent}
    </Drawer>
  );
}
