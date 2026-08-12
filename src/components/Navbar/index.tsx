import React, { ReactNode, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import GoogleIcon from '@mui/icons-material/Google';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useNavigate } from 'react-router-dom';

import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Avatar,
  Menu,
  Tooltip,
  Box,
  Divider,
  ListItemIcon
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { Mode } from 'components/App';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  mode: Mode;
  onChangeMode: () => void;
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ur', label: 'اردو (پاکستان)' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' }
];

const UserNavAuth: React.FC = () => {
  const { user, signInWithGoogle, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  if (!user) {
    return (
      <Button
        onClick={signInWithGoogle}
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<GoogleIcon fontSize="small" />}
        sx={{
          borderRadius: '100px',
          fontWeight: 700,
          textTransform: 'none',
          px: 2,
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' }
        }}
      >
        Login with Google
      </Button>
    );
  }

  return (
    <>
      <Tooltip title={user.displayName || user.email || 'Account'}>
        <IconButton onClick={handleOpenMenu} sx={{ p: 0.5 }}>
          <Avatar
            alt={user.displayName || 'User'}
            src={user.photoURL || undefined}
            sx={{ width: 36, height: 36, border: '2px solid', borderColor: 'primary.main' }}
          >
            {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          elevation: 6,
          sx: { minWidth: 220, mt: 1, borderRadius: 3, p: 0.5 }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" noWrap>
            {user.displayName || 'Google User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user.email}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { handleCloseMenu(); logout(); }}>
          <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

const Navbar: React.FC<NavbarProps> = ({
  mode,
  onChangeMode
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const handleLanguageChange = (event: any) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('lang', newLanguage);
  };

  const navItems: { label: string; path: string }[] = [];

  const languageSelector = (
    <FormControl size="small" sx={{ minWidth: 110 }}>
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        displayEmpty
        sx={{
          color: 'inherit',
          '& .MuiSelect-icon': {
            color: 'inherit'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent'
          }
        }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const buttons: ReactNode[] = [
    <UserNavAuth key="user-nav-auth" />,
    languageSelector,
    <Icon
      key={mode}
      onClick={onChangeMode}
      style={{ cursor: 'pointer' }}
      fontSize={30}
      icon={
        mode === 'dark'
          ? 'ic:round-dark-mode'
          : mode === 'light'
            ? 'ic:round-light-mode'
            : 'ic:round-contrast'
      }
    />,
    <Button
      key="hire-me"
      onClick={() => {
        const link = document.createElement('a');
        link.href = '/cv.pdf';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }}
      sx={{ borderRadius: '100px' }}
      variant={'contained'}
      startIcon={
        <Icon
          style={{ cursor: 'pointer' }}
          fontSize={25}
          icon={'hugeicons:job-search'}
        />
      }
    >
      {t('navbar.hireMe', 'Contact with me')}
    </Button>
  ];

  const drawerList = (
    <List>
      {navItems.map((navItem) => (
        <ListItemButton
          key={navItem.path}
          onClick={() => navigate(navItem.path)}
        >
          <ListItemText primary={navItem.label} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: 'background.default',
        py: 1
      }}
    >
      <Toolbar
        sx={{
          justify: 'space-between',
          justifyContent: 'space-between',
          alignItems: 'center',
          mx: { md: '30px', lg: '80px' }
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src="/Logos/OmniTools-Logo-High-Resolution.png"
              alt="ConvertingHub"
              style={{
                height: isMobile ? '48px' : '60px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <Typography
              component="span"
              sx={{
                ml: 1.5,
                fontWeight: 800,
                fontSize: isMobile ? '1.25rem' : '1.65rem',
                color: 'primary.main',
                letterSpacing: '-0.5px',
                lineHeight: 1
              }}
            >
              ConvertingHub
            </Typography>
          </Link>
        </Stack>
        {isMobile ? (
          <>
            <Stack direction="row" spacing={1} alignItems="center">
              <UserNavAuth />
              <IconButton
                color="inherit"
                onClick={toggleDrawer(true)}
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={toggleDrawer(false)}
            >
              {drawerList}
            </Drawer>
          </>
        ) : (
          <Stack direction="row" spacing={2} alignItems="center">
            {buttons.map((button, index) => (
              <React.Fragment key={index}>{button}</React.Fragment>
            ))}
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
