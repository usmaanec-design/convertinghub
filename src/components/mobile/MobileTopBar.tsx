import React from 'react';
import {
  Box,
  InputBase,
  IconButton,
  Avatar,
  Button,
  useTheme,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GoogleIcon from '@mui/icons-material/Google';
import ClearIcon from '@mui/icons-material/Clear';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MobileTopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onProfileClick: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  searchQuery,
  onSearchChange,
  onProfileClick
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated, signInWithGoogle, isSigningIn } = useAuth();

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        gap: 1.5,
        bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
        borderBottom: `1px solid ${
          theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0'
        }`,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(0,0,0,0.06)'
      }}
    >
      {/* Brand Logo (Left) */}
      <Box
        onClick={() => navigate('/')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        <Box
          component="img"
          src="/Logos/favicon-96x96.png"
          alt="ConvertingHub Logo"
          sx={{
            width: 34,
            height: 34,
            borderRadius: '8px',
            objectFit: 'contain'
          }}
        />
        <Typography
          variant="subtitle1"
          fontWeight={800}
          sx={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: { xs: 'none', sm: 'block' },
            letterSpacing: '-0.5px'
          }}
        >
          ConvertingHub
        </Typography>
      </Box>

      {/* Compact Search Bar Pill (Center) */}
      <Box
        sx={{
          flex: 1,
          maxWidth: 320,
          display: 'flex',
          alignItems: 'center',
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
          borderRadius: '50px',
          px: 1.5,
          py: 0.5,
          border: `1px solid ${
            theme.palette.mode === 'dark' ? '#334155' : '#cbd5e1'
          }`,
          transition: 'all 0.2s ease-in-out',
          '&:focus-within': {
            borderColor: '#2563eb',
            boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)'
          }
        }}
      >
        <SearchIcon
          sx={{
            fontSize: 18,
            color: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
            mr: 1
          }}
        />
        <InputBase
          placeholder="Search tools or files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
          sx={{
            fontSize: '0.85rem',
            color: theme.palette.text.primary,
            '& input': {
              p: 0,
              height: '24px'
            }
          }}
        />
        {searchQuery && (
          <IconButton
            size="small"
            onClick={() => onSearchChange('')}
            sx={{ p: 0.25, color: '#94a3b8' }}
          >
            <ClearIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {/* Auth State Button / Profile Avatar (Right) */}
      <Box sx={{ flexShrink: 0 }}>
        {isAuthenticated && user ? (
          <Avatar
            src={user.photoURL || undefined}
            alt={user.displayName || 'User Profile'}
            onClick={onProfileClick}
            sx={{
              width: 36,
              height: 36,
              cursor: 'pointer',
              border: '2px solid #2563eb',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}
          >
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </Avatar>
        ) : (
          <Button
            variant="contained"
            size="small"
            disabled={isSigningIn}
            onClick={() => signInWithGoogle()}
            startIcon={<GoogleIcon sx={{ fontSize: '16px !important' }} />}
            sx={{
              minWidth: '44px',
              minHeight: '36px',
              px: 1.5,
              borderRadius: '20px',
              textTransform: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
              }
            }}
          >
            Login
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default MobileTopBar;
