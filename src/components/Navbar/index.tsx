import React, { ReactNode, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import GoogleIcon from '@mui/icons-material/Google';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
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
  ListItemIcon,
  CircularProgress,
  Chip,
  alpha
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { Mode } from '../App';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useTabs } from '../../contexts/TabContext';
import { tools } from '../../tools';
import ContactModal from '../ContactModal';
import { TokenWallet } from '../TokenWallet';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ur', label: 'اردو' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' }
];

const UserNavAuth: React.FC = () => {
  const { user, signInWithGoogle, logout, isSigningIn } = useAuth();
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
        disabled={isSigningIn}
        variant="outlined"
        color="primary"
        size="small"
        startIcon={
          isSigningIn ? (
            <CircularProgress size={14} color="inherit" />
          ) : (
            <GoogleIcon fontSize="small" />
          )
        }
        sx={{
          borderRadius: '100px',
          fontWeight: 700,
          textTransform: 'none',
          px: 2,
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' }
        }}
      >
        {isSigningIn ? 'Connecting...' : 'Continue with Google'}
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
            sx={{
              width: 36,
              height: 36,
              border: '2px solid',
              borderColor: 'primary.main'
            }}
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
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            display="block"
          >
            {user.email}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          component={Link}
          to="/settings"
          onClick={handleCloseMenu}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" color="primary" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem
          component={Link}
          to="/account"
          onClick={handleCloseMenu}
        >
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" color="primary" />
          </ListItemIcon>
          Account & Billing
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            logout();
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default function Navbar({
  onChangeMode,
  mode
}: {
  mode: Mode;
  onChangeMode: () => void;
}) {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { favoriteTools } = usePreferences();
  const { openTab } = useTabs();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLanguageChange = (event: any) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('lang', newLanguage);
  };

  const languageSelector = (
    <FormControl size="small" sx={{ minWidth: 100 }}>
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
    <TokenWallet key="token-wallet" />,
    <Button
      key="pricing"
      component={Link}
      to="/pricing"
      variant="text"
      color="inherit"
      sx={{ fontWeight: 700, borderRadius: '100px', textTransform: 'none' }}
    >
      Pricing
    </Button>,
    <Tooltip key="settings-btn" title="Settings">
      <IconButton
        onClick={() => navigate('/settings')}
        sx={{ p: 1, color: 'inherit' }}
      >
        <SettingsIcon />
      </IconButton>
    </Tooltip>,
    <UserNavAuth key="user-nav-auth" />,
    languageSelector,
    <Icon
      key={mode}
      onClick={onChangeMode}
      style={{ cursor: 'pointer' }}
      fontSize={28}
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
      onClick={() => setContactModalOpen(true)}
      sx={{ borderRadius: '100px' }}
      variant={'contained'}
      size="small"
      startIcon={
        <Icon
          style={{ cursor: 'pointer' }}
          fontSize={20}
          icon={'hugeicons:job-search'}
        />
      }
    >
      {t('navbar.hireMe', 'Contact')}
    </Button>
  ];

  return (
    <>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          backgroundColor: 'background.default',
          py: 0.5
        }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 2, md: 5 }
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none'
              }}
            >
              <img
                src="/Logos/OmniTools-Logo-High-Resolution.png"
                alt="ConvertingHub"
                style={{
                  height: '44px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
              />
              <Typography
                component="span"
                sx={{
                  ml: 1.25,
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  color: 'primary.main',
                  letterSpacing: '-0.5px',
                  lineHeight: 1
                }}
              >
                ConvertingHub
              </Typography>
            </Link>

            {/* QUICK FAVORITE TOOLS BAR */}
            {!isMobile && favoriteTools.length > 0 && (
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ ml: 2 }}>
                {favoriteTools.slice(0, 4).map((favId) => {
                  const matchedTool = tools.find(
                    (t) => t.path.replace(/^\//, '') === favId || t.path === favId
                  );
                  if (!matchedTool) return null;

                  return (
                    <Chip
                      key={favId}
                      icon={<StarIcon sx={{ fontSize: '13px !important', color: 'warning.main' }} />}
                      label={matchedTool.name}
                      onClick={() => {
                        const path = matchedTool.path.startsWith('/') ? matchedTool.path : `/${matchedTool.path}`;
                        openTab({ path, title: matchedTool.name, icon: matchedTool.icon });
                      }}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderRadius: '100px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderColor: alpha(theme.palette.divider, 0.8),
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                    />
                  );
                })}
              </Stack>
            )}
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {buttons.map((button, index) => (
              <React.Fragment key={index}>{button}</React.Fragment>
            ))}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Contact Modal */}
      <ContactModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </>
  );
}
