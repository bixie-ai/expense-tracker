import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import MuiToolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLayout } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';

export function Toolbar() {
  const { isHandset, toggleSidebar } = useLayout();
  const { userDetails, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const displayName = userDetails
    ? `${userDetails.firstName} ${userDetails.lastName}`
    : 'User';

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
  };

  const handleViewProfile = () => {
    handleMenuClose();
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <MuiToolbar>
        {isHandset && (
          <IconButton
            edge="start"
            aria-label="Toggle navigation menu"
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {isHandset && (
          <Typography variant="h5" component="h1" sx={{ fontWeight: 300 }}>
            Expense Tracker
          </Typography>
        )}
        <Button
          onClick={handleMenuOpen}
          variant="outlined"
          sx={{ ml: 'auto', textTransform: 'none' }}
          startIcon={<AccountCircleIcon sx={{ transform: 'scale(1.3)' }} />}
          aria-haspopup="true"
          aria-expanded={menuOpen ? 'true' : undefined}
          aria-controls={menuOpen ? 'user-menu' : undefined}
        >
          {displayName}
        </Button>
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewProfile}>
            <ListItemIcon>
              <ManageAccountsIcon />
            </ListItemIcon>
            <ListItemText>View Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText>Log out</ListItemText>
          </MenuItem>
        </Menu>
      </MuiToolbar>
    </AppBar>
  );
}
