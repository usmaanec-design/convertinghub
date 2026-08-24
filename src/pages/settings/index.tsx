import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Switch,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InfoIcon from '@mui/icons-material/Info';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import SecurityIcon from '@mui/icons-material/Security';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { tools } from '../../tools';
import { Mode } from '../../components/App';

interface SettingsPageProps {
  currentMode?: Mode;
  onChangeMode?: (mode: Mode) => void;
}

export default function SettingsPage({ currentMode, onChangeMode }: SettingsPageProps) {
  const { user, isProUser, tokenWallet, setProStatus } = useAuth();
  const { favoriteTools, toggleFavorite, isFavorite, reorderFavorites } = usePreferences();
  const theme = useTheme();

  const [selectedTheme, setSelectedTheme] = useState<Mode>(() => {
    return (localStorage.getItem('theme') as Mode) || currentMode || 'system';
  });

  const [autoOpenDownloads, setAutoOpenDownloads] = useState<boolean>(() => {
    return localStorage.getItem('convertinghub_auto_open_downloads') === 'true';
  });

  const [adobeStats, setAdobeStats] = useState<{
    adobeMonthlyLimit: number;
    adobeMonthlyUsage: number;
    remainingCapacity: number;
  } | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isProUser) {
      fetch('/api/admin/adobe-stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.stats) {
            setAdobeStats(data.stats);
          }
        })
        .catch(() => {});
    }
  }, [isProUser]);

  const handleThemeChange = (newTheme: Mode) => {
    setSelectedTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (onChangeMode) {
      onChangeMode(newTheme);
    } else {
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFavs = [...favoriteTools];
    const temp = newFavs[index - 1];
    newFavs[index - 1] = newFavs[index];
    newFavs[index] = temp;
    reorderFavorites(newFavs);
  };

  const handleMoveDown = (index: number) => {
    if (index === favoriteTools.length - 1) return;
    const newFavs = [...favoriteTools];
    const temp = newFavs[index + 1];
    newFavs[index + 1] = newFavs[index];
    newFavs[index] = temp;
    reorderFavorites(newFavs);
  };

  const clearHistory = () => {
    localStorage.removeItem('convertinghub_recent_tools');
    localStorage.removeItem('guestToolUsageCount');
    setSuccessMessage('Local search and tool history cleared successfully.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        px: { xs: 2, sm: 4 },
        backgroundColor: 'background.default',
        minHeight: '85vh'
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" fontWeight={900} gutterBottom color="text.primary">
          Settings & Preferences
        </Typography>
        <Typography color="text.secondary" paragraph mb={4}>
          Customize application theme, manage favorite tools, configure download preferences, and check account status.
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
            {successMessage}
          </Alert>
        )}

        <Stack spacing={4}>
          {/* 1. APPEARANCE SETTINGS */}
          <Paper elevation={1} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1}>
              <DarkModeIcon color="primary" /> Appearance & Theme
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select your visual preference. Night mode updates the entire interface consistently.
            </Typography>

            <RadioGroup
              row
              value={selectedTheme}
              onChange={(e) => handleThemeChange(e.target.value as Mode)}
            >
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Paper
                    variant="outlined"
                    onClick={() => handleThemeChange('system')}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      cursor: 'pointer',
                      borderColor: selectedTheme === 'system' ? 'primary.main' : 'divider',
                      backgroundColor: selectedTheme === 'system' ? 'action.selected' : 'background.paper'
                    }}
                  >
                    <FormControlLabel
                      value="system"
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <SettingsBrightnessIcon fontSize="small" /> System Default
                        </Box>
                      }
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper
                    variant="outlined"
                    onClick={() => handleThemeChange('light')}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      cursor: 'pointer',
                      borderColor: selectedTheme === 'light' ? 'primary.main' : 'divider',
                      backgroundColor: selectedTheme === 'light' ? 'action.selected' : 'background.paper'
                    }}
                  >
                    <FormControlLabel
                      value="light"
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <LightModeIcon fontSize="small" /> Light Mode
                        </Box>
                      }
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper
                    variant="outlined"
                    onClick={() => handleThemeChange('dark')}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      cursor: 'pointer',
                      borderColor: selectedTheme === 'dark' ? 'primary.main' : 'divider',
                      backgroundColor: selectedTheme === 'dark' ? 'action.selected' : 'background.paper'
                    }}
                  >
                    <FormControlLabel
                      value="dark"
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <DarkModeIcon fontSize="small" /> Dark / Night Mode
                        </Box>
                      }
                    />
                  </Paper>
                </Grid>
              </Grid>
            </RadioGroup>
          </Paper>

          {/* 2. TOOL ORGANIZATION & FAVORITES */}
          <Paper elevation={1} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1}>
              <StarIcon color="warning" /> Customize Favorite Tools & Order
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Starred tools appear in your customizable top quick-access bar. Use arrows to reorder.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight={800} gutterBottom color="primary">
              TOP QUICK-ACCESS TOOLS ({favoriteTools.length})
            </Typography>

            <List sx={{ width: '100%', mb: 3 }}>
              {favoriteTools.map((favId, index) => {
                const matchedTool = tools.find(
                  (t) => t.path.replace(/^\//, '') === favId || t.path === favId
                );
                const title = matchedTool ? matchedTool.name : favId;

                return (
                  <Paper
                    key={favId}
                    variant="outlined"
                    sx={{ mb: 1, p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center' }}
                  >
                    <Typography variant="body2" fontWeight={700} sx={{ width: 30, color: 'text.secondary' }}>
                      {index + 1}.
                    </Typography>
                    <ListItemText
                      primary={title}
                      secondary={matchedTool ? matchedTool.shortDescription : ''}
                      primaryTypographyProps={{ fontWeight: 700 }}
                    />
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === favoriteTools.length - 1}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => toggleFavorite(favId)}>
                        <StarIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                );
              })}
            </List>

            <Typography variant="subtitle2" fontWeight={800} gutterBottom>
              ALL CONVERTINGHUB TOOLS
            </Typography>
            <Box sx={{ maxHeight: 250, overflowY: 'auto', pr: 1 }}>
              <Grid container spacing={1}>
                {tools.map((tool) => {
                  const cleanPath = tool.path.replace(/^\//, '');
                  const fav = isFavorite(cleanPath);

                  return (
                    <Grid item xs={12} sm={6} key={cleanPath}>
                      <Paper
                        variant="outlined"
                        onClick={() => toggleFavorite(cleanPath)}
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderColor: fav ? 'warning.main' : 'divider',
                          backgroundColor: fav ? 'action.hover' : 'transparent'
                        }}
                      >
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {tool.name}
                        </Typography>
                        <IconButton size="small" color={fav ? 'warning' : 'default'}>
                          {fav ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                        </IconButton>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Paper>

          {/* 3. FILES & DOWNLOADS */}
          <Paper elevation={1} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1}>
              <FolderZipIcon color="primary" /> Files & Download Preferences
            </Typography>
            <Stack spacing={2} mt={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Auto-Open Downloaded Files
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Prompt to open converted files automatically after completion.
                  </Typography>
                </Box>
                <Switch
                  checked={autoOpenDownloads}
                  onChange={(e) => {
                    setAutoOpenDownloads(e.target.checked);
                    localStorage.setItem('convertinghub_auto_open_downloads', e.target.checked ? 'true' : 'false');
                  }}
                />
              </Box>
            </Stack>
          </Paper>

          {/* 4. PRIVACY */}
          <Paper elevation={1} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1}>
              <SecurityIcon color="primary" /> Privacy & Local Data
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              All document conversions are processed securely. Clearing local history removes search logs saved in browser.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={clearHistory}
              sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 700 }}
            >
              Clear Local History & Recent Files
            </Button>
          </Paper>

          {/* 5. ACCOUNT & SUBSCRIPTION */}
          <Paper elevation={1} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1}>
              <AccountCircleIcon color="primary" /> Account & Subscription
            </Typography>

            <Stack spacing={2} mt={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1" fontWeight={800}>
                    {user ? user.displayName || user.email : 'Guest User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Plan Status:{' '}
                    <Chip
                      label={isProUser ? 'PRO / PREMIUM' : 'FREE'}
                      color={isProUser ? 'primary' : 'default'}
                      size="small"
                      sx={{ fontWeight: 800, ml: 1 }}
                    />
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setProStatus(!isProUser)}
                  sx={{ borderRadius: 100, textTransform: 'none', fontWeight: 700 }}
                >
                  Switch to {isProUser ? 'Free' : 'Pro'} Mode
                </Button>
              </Box>

              {/* FOR PRO USERS ONLY - TOKEN BALANCE & ADOBE CAPACITY */}
              {isProUser && tokenWallet && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    mt: 2
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800} color="primary" gutterBottom display="flex" alignItems="center" gap={1}>
                    <WorkspacePremiumIcon /> Premium Token Information
                  </Typography>
                  <Grid container spacing={2} mt={1}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        AVAILABLE TODAY
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>
                        {tokenWallet.availableTokens}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        USED TODAY
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>
                        {tokenWallet.dailyUsed}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        DAILY LIMIT
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>
                        {tokenWallet.dailyLimit}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        MONTHLY CAPACITY
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>
                        {adobeStats ? `${adobeStats.adobeMonthlyUsage} / ${adobeStats.adobeMonthlyLimit}` : '287 / 500'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Stack>
          </Paper>

          {/* 6. ABOUT */}
          <Paper elevation={1} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1}>
              <InfoIcon color="primary" /> About ConvertingHub
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              ConvertingHub — Fast, powerful and easy-to-use document utility application.
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label="Version 0.7.0" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} ConvertingHub. All rights reserved.
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
