import React, { useState, useEffect } from 'react';
import { Box, useTheme, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLocation, useNavigate } from 'react-router-dom';
import MobileTopBar from './MobileTopBar';
import MobileBottomNav, { MobileTabType } from './MobileBottomNav';
import MobileHomeTab from './tabs/MobileHomeTab';
import MobileFilesTab from './tabs/MobileFilesTab';
import MobileToolsTab from './tabs/MobileToolsTab';
import MobileProfileTab from './tabs/MobileProfileTab';
import MobileScannerModal from './tabs/MobileScannerModal';

interface MobileLayoutProps {
  children: React.ReactNode;
  mode: 'dark' | 'light' | 'system';
  onChangeMode: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  mode,
  onChangeMode
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<MobileTabType>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  const isMainTabPath = location.pathname === '/';

  // Handle hardware / browser back button for mobile navigation
  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== 'home') {
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && activeTab !== 'tools') {
      setActiveTab('tools');
    }
  };

  const handleTabChange = (tab: MobileTabType) => {
    setActiveTab(tab);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Top Bar Header */}
      {isMainTabPath ? (
        <MobileTopBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onProfileClick={() => setActiveTab('profile')}
        />
      ) : (
        /* Mobile Dedicated Tool Header with Back Arrow */
        <Box
          component="header"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            gap: 1,
            bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
            borderBottom: `1px solid ${
              theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0'
            }`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}
        >
          <IconButton onClick={() => navigate('/')} color="inherit">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            ConvertingHub Tool
          </Typography>
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          pt: isMainTabPath ? '64px' : '56px',
          pb: '64px',
          width: '100%'
        }}
      >
        {isMainTabPath ? (
          <>
            {activeTab === 'home' && (
              <MobileHomeTab onOpenScanner={() => setIsScannerOpen(true)} />
            )}
            {activeTab === 'files' && <MobileFilesTab />}
            {activeTab === 'tools' && (
              <MobileToolsTab
                searchQuery={searchQuery}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}
            {activeTab === 'profile' && (
              <MobileProfileTab
                currentMode={mode}
                onToggleTheme={onChangeMode}
              />
            )}
          </>
        ) : (
          <Box sx={{ p: 2 }}>{children}</Box>
        )}
      </Box>

      {/* Camera Document Scanner Modal */}
      <MobileScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Fixed Bottom Navigation Bar */}
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </Box>
  );
};

export default MobileLayout;
