import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  useTheme
} from '@mui/material';
import { Icon } from '@iconify/react';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import { tools } from '../../../tools';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface MobileToolsTabProps {
  searchQuery: string;
  onOpenScanner: () => void;
}

export const MobileToolsTab: React.FC<MobileToolsTabProps> = ({
  searchQuery,
  onOpenScanner
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;
    const query = searchQuery.toLowerCase().trim();
    return tools.filter((tool) => {
      const name = (
        t(tool.name, { defaultValue: tool.path }) as string
      ).toLowerCase();
      const desc = (
        t(tool.shortDescription, { defaultValue: '' }) as string
      ).toLowerCase();
      const keywords = (tool.keywords || []).join(' ').toLowerCase();
      return (
        name.includes(query) ||
        desc.includes(query) ||
        keywords.includes(query) ||
        tool.path.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, t]);

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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Typography variant="h6" fontWeight={800} color="text.primary">
          Tools ({filteredTools.length + 1})
        </Typography>
      </Box>

      <Grid container spacing={1.5}>
        {/* Document Camera Scanner Tile (First Tile) */}
        {(!searchQuery ||
          'scanner document camera scan'.includes(searchQuery.toLowerCase())) && (
          <Grid item xs={4} sm={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: '16px',
                height: 110,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(37, 99, 235, 0.15)'
                    : '#eff6ff',
                border: '1.5px solid #2563eb',
                transition: 'transform 0.2s ease',
                '&:active': { transform: 'scale(0.95)' }
              }}
            >
              <CardActionArea
                onClick={onOpenScanner}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 0.75,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  <DocumentScannerIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="#2563eb"
                  sx={{
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    lineHeight: 1.15,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    px: 0.5
                  }}
                >
                  Scanner
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        )}

        {/* Dynamic Registered Tools Tiles */}
        {filteredTools.map((tool) => {
          const rawName = t(tool.name, {
            defaultValue: tool.path.replace(/^(pdf|converters|image|string|video|audio|csv|json|xml|number|time|arc-maps)\//, '').replace(/-/g, ' ')
          }) as string;

          const formattedPath = tool.path.startsWith('/')
            ? tool.path
            : `/${tool.path}`;

          return (
            <Grid item xs={4} sm={3} key={tool.path}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  height: 110,
                  bgcolor:
                    theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                  border: `1px solid ${
                    theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
                  }`,
                  transition: 'transform 0.2s ease',
                  '&:active': { transform: 'scale(0.95)' }
                }}
              >
                <CardActionArea
                  onClick={() => navigate(formattedPath)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      bgcolor:
                        theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 0.75,
                      fontSize: 20
                    }}
                  >
                    {typeof tool.icon === 'string' ? (
                      <Icon icon={tool.icon} width="20" height="20" />
                    ) : (
                      <Icon icon={tool.icon} width="20" height="20" />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.primary"
                    sx={{
                      fontSize: '0.68rem',
                      textAlign: 'center',
                      lineHeight: 1.15,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word',
                      maxHeight: '2.3em',
                      px: 0.5
                    }}
                  >
                    {rawName}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default MobileToolsTab;
