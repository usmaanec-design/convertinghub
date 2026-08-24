import React, { useRef, useEffect } from 'react';
import { Box, IconButton, Tooltip, useTheme, alpha } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Icon } from '@iconify/react';
import { useTabs } from '../../contexts/TabContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, activateTab, closeTab } = useTabs();
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    }
  }, [activeTabId]);

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? '#121621' : '#f1f5f9',
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        px: { xs: 1, sm: 2, md: 4 },
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        zIndex: 10,
        userSelect: 'none'
      }}
    >
      <Box
        ref={scrollContainerRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          py: 0.25,
          flexGrow: 1,
          '::-webkit-scrollbar': { height: '3px' },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.text.secondary, 0.2),
            borderRadius: '4px'
          }
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isHome = tab.isHome;

          return (
            <Box
              key={tab.id}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => activateTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  activateTab(tab.id);
                }
              }}
              tabIndex={0}
              role="tab"
              aria-selected={isActive}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.8,
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
                backgroundColor: isActive
                  ? theme.palette.background.paper
                  : 'transparent',
                boxShadow: isActive
                  ? theme.palette.mode === 'dark'
                    ? '0 -2px 10px rgba(0,0,0,0.3)'
                    : '0 -2px 8px rgba(0,0,0,0.05)'
                  : 'none',
                border: '1px solid',
                borderColor: isActive
                  ? theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha(theme.palette.primary.main, 0.2)
                  : 'transparent',
                borderBottomColor: isActive ? theme.palette.background.paper : 'transparent',
                transition: 'all 0.15s ease-in-out',
                maxWidth: 220,
                minWidth: isHome ? 90 : 130,
                whiteSpace: 'nowrap',
                position: 'relative',
                '&:hover': {
                  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                  backgroundColor: isActive
                    ? theme.palette.background.paper
                    : alpha(theme.palette.primary.main, 0.06)
                }
              }}
            >
              {tab.icon && (
                <Icon
                  icon={tab.icon}
                  fontSize={17}
                  style={{
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    flexShrink: 0
                  }}
                />
              )}

              <Box
                component="span"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexGrow: 1
                }}
              >
                {t(tab.title, tab.title)}
              </Box>

              {!isHome && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  aria-label={`Close ${tab.title} tab`}
                  sx={{
                    p: 0.25,
                    ml: 0.5,
                    color: isActive ? 'text.secondary' : 'action.disabled',
                    borderRadius: '50%',
                    '&:hover': {
                      color: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.error.main, 0.1)
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>

      <Tooltip title="Open Settings">
        <IconButton
          size="small"
          onClick={() => navigate('/settings')}
          sx={{
            ml: 1,
            p: 0.6,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2)
            }
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
