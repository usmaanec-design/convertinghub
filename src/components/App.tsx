import {
  BrowserRouter,
  Navigate,
  RouteObject,
  useRoutes
} from 'react-router-dom';
import routesConfig from '../config/routesConfig';
import Navbar from './Navbar';
import { TabBar } from './TabBar';
import { Suspense, useState, useEffect } from 'react';
import Loading from './Loading';
import ErrorBoundary from './ErrorBoundary';
import { Box, CssBaseline, Theme, ThemeProvider } from '@mui/material';
import { CustomSnackBarProvider } from '../contexts/CustomSnackBarContext';
import { SnackbarProvider } from 'notistack';
import { tools } from '../tools';
import './index.css';
import { darkTheme, lightTheme } from '../config/muiConfig';
import ScrollToTopButton from './ScrollToTopButton';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { UserTypeFilterProvider } from 'providers/UserTypeFilterProvider';
import { LibreOfficeProvider } from '../context/LibreOfficeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';
import { TabProvider } from '../contexts/TabContext';
import { GuestLoginReminder } from './GuestLoginReminder';
import { FirstLaunchAuthDialog } from './FirstLaunchAuthDialog';
import { MicrosoftStoreRatingDialog } from './MicrosoftStoreRatingDialog';
import { DownloadAuthModal } from './DownloadAuthModal';

import Footer from './Footer';

import MobileLayout from './mobile/MobileLayout';
import useIsMobile from '../hooks/useIsMobile';

export type Mode = 'dark' | 'light' | 'system';

const AppRoutes = () => {
  const updatedRoutesConfig: RouteObject[] = [...routesConfig];
  tools.forEach((tool) => {
    const formattedPath = tool.path.startsWith('/')
      ? tool.path
      : `/${tool.path}`;
    updatedRoutesConfig.push({
      path: formattedPath,
      element: tool.component()
    });

    // Also register short route without category prefix (e.g. /pdf-to-word in addition to /pdf/pdf-to-word)
    const parts = tool.path.split('/');
    if (parts.length > 1) {
      const shortPath = `/${parts.slice(1).join('/')}`;
      updatedRoutesConfig.push({
        path: shortPath,
        element: tool.component()
      });
    }
  });
  updatedRoutesConfig.push({
    path: '*',
    element: <Navigate to="/404" replace />
  });
  return useRoutes(updatedRoutesConfig);
};

function App() {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem('theme') || 'system') as Mode
  );
  const [theme, setTheme] = useState<Theme>(() => getTheme(mode));
  useEffect(() => setTheme(getTheme(mode)), [mode]);

  useEffect(() => {
    const systemDarkModeQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? darkTheme : lightTheme);
    };
    systemDarkModeQuery.addEventListener('change', handleThemeChange);

    return () => {
      systemDarkModeQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const handleToggleMode = () => {
    setMode((prev) => nextMode(prev));
    localStorage.setItem('theme', nextMode(mode));
  };

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={5}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          <CustomSnackBarProvider>
            <AuthProvider>
              <PreferencesProvider>
                <UserTypeFilterProvider>
                  <LibreOfficeProvider>
                    <BrowserRouter
                      future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true
                      }}
                    >
                      <TabProvider>
                        {isMobile ? (
                          <MobileLayout mode={mode} onChangeMode={handleToggleMode}>
                            <Suspense fallback={<Loading />}>
                              <ErrorBoundary>
                                <AppRoutes />
                              </ErrorBoundary>
                            </Suspense>
                          </MobileLayout>
                        ) : (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              minHeight: '100vh',
                              width: '100%',
                              alignItems: 'stretch'
                            }}
                          >
                            <Navbar
                              mode={mode}
                              onChangeMode={handleToggleMode}
                            />
                            <TabBar />
                            <Box
                              component="main"
                              sx={{ flexGrow: 1, width: '100%', minWidth: '100%' }}
                            >
                              <Suspense fallback={<Loading />}>
                                <ErrorBoundary>
                                  <AppRoutes />
                                </ErrorBoundary>
                              </Suspense>
                            </Box>
                            <Footer />
                            <GuestLoginReminder />
                            <FirstLaunchAuthDialog />
                            <MicrosoftStoreRatingDialog />
                            <DownloadAuthModal />
                          </Box>
                        )}
                      </TabProvider>
                    </BrowserRouter>
                  </LibreOfficeProvider>
                </UserTypeFilterProvider>
              </PreferencesProvider>
            </AuthProvider>
          </CustomSnackBarProvider>
        </SnackbarProvider>
        {!isMobile && <ScrollToTopButton />}
      </ThemeProvider>
    </I18nextProvider>
  );
}

function getTheme(mode: Mode): Theme {
  switch (mode) {
    case 'dark':
      return darkTheme;
    case 'light':
      return lightTheme;
    default:
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? darkTheme
        : lightTheme;
  }
}

function nextMode(mode: Mode): Mode {
  return mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
}

export default App;
