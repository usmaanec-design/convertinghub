import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import FolderCopyRoundedIcon from '@mui/icons-material/FolderCopyRounded';
import HomeRepairServiceRoundedIcon from '@mui/icons-material/HomeRepairServiceRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';

export type MobileTabType = 'home' | 'files' | 'tools' | 'profile';

interface MobileBottomNavProps {
  activeTab: MobileTabType;
  onTabChange: (tab: MobileTabType) => void;
}

interface NavItemDef {
  id: MobileTabType;
  label: string;
  icon: React.ReactNode;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange
}) => {
  const theme = useTheme();

  const navItems: NavItemDef[] = [
    { id: 'home', label: 'Home', icon: <HomeRoundedIcon /> },
    { id: 'files', label: 'Files', icon: <FolderCopyRoundedIcon /> },
    { id: 'tools', label: 'Tools', icon: <HomeRepairServiceRoundedIcon /> },
    { id: 'profile', label: 'Profile', icon: <AccountCircleRoundedIcon /> }
  ];

  const activeIndex = navItems.findIndex((item) => item.id === activeTab);

  return (
    <Box
      component="nav"
      aria-label="Mobile Navigation"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
        borderTop: `1px solid ${
          theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0'
        }`,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 -4px 20px rgba(0,0,0,0.5)'
            : '0 -4px 20px rgba(0,0,0,0.06)',
        pb: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Sliding Active Line Indicator at top of bottom nav */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: `${(100 / navItems.length) * activeIndex}%`,
          width: `${100 / navItems.length}%`,
          height: '3px',
          display: 'flex',
          justifyContent: 'center',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Box
          sx={{
            width: '40px',
            height: '100%',
            bgcolor: '#2563eb',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 0 8px rgba(37, 99, 235, 0.8)'
          }}
        />
      </Box>

      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <Box
            key={item.id}
            onClick={() => onTabChange(item.id)}
            sx={{
              flex: 1,
              height: '100%',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s ease',
              color: isActive
                ? '#2563eb'
                : theme.palette.mode === 'dark'
                ? '#94a3b8'
                : '#64748b',
              transform: isActive ? 'translateY(-2px)' : 'none',
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                transition: 'transform 0.2s ease',
                transform: isActive ? 'scale(1.15)' : 'scale(1)'
              }}
            >
              {item.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.72rem',
                fontWeight: isActive ? 700 : 500,
                mt: 0.25,
                color: 'inherit'
              }}
            >
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default MobileBottomNav;
