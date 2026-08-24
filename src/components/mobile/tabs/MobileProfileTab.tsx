import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Button,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Chip
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import StarIcon from '@mui/icons-material/Star';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MobileProfileTabProps {
  currentMode: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
}

export const MobileProfileTab: React.FC<MobileProfileTabProps> = ({
  currentMode,
  onToggleTheme
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated, signInWithGoogle, logout, isSigningIn, isProUser } =
    useAuth();

  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        px: 2,
        pt: 2,
        pb: 10,
        width: '100%',
        maxWidth: 600,
        mx: 'auto'
      }}
    >
      <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
        Profile & Settings
      </Typography>

      {/* User Identity Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '20px',
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          border: `1px solid ${
            theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
          }`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          mb: 3
        }}
      >
        {isAuthenticated && user ? (
          <>
            <Avatar
              src={user.photoURL || undefined}
              alt={user.displayName || 'User'}
              sx={{
                width: 72,
                height: 72,
                mb: 1.5,
                border: '3px solid #2563eb',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              {user.displayName
                ? user.displayName.charAt(0).toUpperCase()
                : 'U'}
            </Avatar>
            <Typography variant="h6" fontWeight={700}>
              {user.displayName || 'ConvertingHub User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {user.email}
            </Typography>

            <Chip
              icon={<StarIcon sx={{ fontSize: '16px !important' }} />}
              label={isProUser ? 'PRO Unlimited Plan' : 'Free Tier'}
              color={isProUser ? 'primary' : 'default'}
              size="small"
              sx={{ fontWeight: 700, mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ManageAccountsIcon />}
                onClick={() => navigate('/account')}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Account
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<LogoutIcon />}
                onClick={() => logout()}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Sign Out
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mb: 1.5,
                bgcolor: '#334155',
                color: '#94a3b8'
              }}
            />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Guest Account
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, maxWidth: 280 }}
            >
              Sign in with your Google account to sync conversions, unlock priority cloud processing, and manage your plan.
            </Typography>

            <Button
              variant="contained"
              disabled={isSigningIn}
              startIcon={<GoogleIcon />}
              onClick={() => signInWithGoogle()}
              sx={{
                borderRadius: '24px',
                px: 4,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              Sign In with Google
            </Button>
          </>
        )}
      </Paper>

      {/* Embedded Mobile Settings & Legal Links */}
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="text.secondary"
        sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}
      >
        Preferences & Legal
      </Typography>

      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          border: `1px solid ${
            theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
          }`,
          overflow: 'hidden'
        }}
      >
        <List disablePadding>
          {/* Theme Toggle Item */}
          <ListItem
            sx={{
              py: 1.75,
              px: 2.5,
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ListItemIcon sx={{ minWidth: 'auto', color: '#2563eb' }}>
                {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={700}>
                    App Theme
                  </Typography>
                }
                secondary={isDarkMode ? 'Dark Mode' : 'Light Mode'}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </Box>
            <Switch
              checked={isDarkMode}
              onChange={onToggleTheme}
              color="primary"
            />
          </ListItem>

          <Divider
            sx={{
              borderColor: theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9'
            }}
          />

          {/* Privacy Policy */}
          <ListItem
            onClick={() => navigate('/privacy-policy')}
            sx={{ py: 1.75, px: 2.5, cursor: 'pointer' }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', mr: 2, color: '#38bdf8' }}>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight={600}>
                  Privacy Policy
                </Typography>
              }
              secondary="Data handling & security terms"
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
          </ListItem>

          <Divider
            sx={{
              borderColor: theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9'
            }}
          />

          {/* Terms of Service */}
          <ListItem
            onClick={() => navigate('/terms-of-service')}
            sx={{ py: 1.75, px: 2.5, cursor: 'pointer' }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', mr: 2, color: '#8b5cf6' }}>
              <DescriptionIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight={600}>
                  Terms of Service
                </Typography>
              }
              secondary="User terms & conditions"
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
          </ListItem>

          <Divider
            sx={{
              borderColor: theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9'
            }}
          />

          {/* Refund Policy */}
          <ListItem
            onClick={() => navigate('/refund-policy')}
            sx={{ py: 1.75, px: 2.5, cursor: 'pointer' }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', mr: 2, color: '#ec4899' }}>
              <ReceiptLongIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight={600}>
                  Refund Policy
                </Typography>
              }
              secondary="Cancellation & refund guidelines"
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
          </ListItem>

          <Divider
            sx={{
              borderColor: theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9'
            }}
          />

          {/* Pricing & Plans */}
          <ListItem
            onClick={() => navigate('/pricing')}
            sx={{ py: 1.75, px: 2.5, cursor: 'pointer' }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', mr: 2, color: '#10b981' }}>
              <ContactSupportIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight={600}>
                  Plans & Pricing
                </Typography>
              }
              secondary="Upgrade to PRO for unlimited server conversions"
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default MobileProfileTab;
