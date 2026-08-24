import {
  Box,
  Divider,
  Stack,
  styled,
  TextField,
  useTheme
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { filterTools, getToolsByCategory } from '../../tools';
import Hero from 'components/Hero';
import {
  getI18nNamespaceFromToolCategory,
  getToolCategoryTitle
} from '@utils/string';
import { Icon } from '@iconify/react';
import { categoriesColors } from 'config/uiConfig';
import React, { useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import UserTypeFilter from '@components/UserTypeFilter';
import { useTranslation } from 'react-i18next';
import { I18nNamespaces, validNamespaces } from '../../i18n';
import { useUserTypeFilter } from '../../providers/UserTypeFilterProvider';
import SEOHead from 'components/SEOHead';
import { getCategorySeoData } from 'seo/seoConfig';

const StyledLink = styled(Link)(({ theme }) => ({
  '&:hover': {
    color: theme.palette.mode === 'dark' ? 'white' : theme.palette.primary.light
  }
}));

export default function ToolsByCategory() {
  const navigate = useNavigate();
  const theme = useTheme();
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const { categoryName } = useParams();
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const { selectedUserTypes, setSelectedUserTypes } = useUserTypeFilter();
  const { t } = useTranslation(validNamespaces);
  const rawTitle = getToolCategoryTitle(categoryName as string, t);
  // First get tools by category without filtering
  const toolsByCategory = getToolsByCategory(selectedUserTypes, t).find(
    ({ type }) => type === categoryName
  );
  const categoryDefinedTools = toolsByCategory?.tools ?? [];

  const categoryTools = filterTools(
    categoryDefinedTools,
    searchTerm,
    selectedUserTypes,
    t
  );

  const categorySeo = getCategorySeoData(
    categoryName as string,
    rawTitle,
    toolsByCategory?.description || ''
  );

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <Box sx={{ backgroundColor: 'background.default' }}>
      <SEOHead
        title={categorySeo.title}
        description={categorySeo.description}
        canonicalUrl={categorySeo.canonicalUrl}
        ogImage={categorySeo.ogImage}
      />
      <Box
        padding={5}
        display={'flex'}
        flexDirection={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        width={'100%'}
      >
        <Hero />
      </Box>
      <Divider sx={{ borderColor: theme.palette.primary.main }} />
      <Box ref={mainContentRef} mt={3} ml={0} px={{ xs: 2, sm: 3, md: 4 }} py={3}>
        <Stack direction={'row'} justifyContent={'space-between'} spacing={2}>
          <Stack direction={'row'} alignItems={'center'} spacing={1}>
            <IconButton onClick={() => navigate('/')}>
              <ArrowBackIcon color={'primary'} />
            </IconButton>
            <Typography fontSize={22} color={theme.palette.primary.main}>
              {t('translation:toolLayout.allToolsTitle', { type: rawTitle })}
            </Typography>
          </Stack>
          <TextField
            placeholder={t('translation:hero.search.placeholder')}
            aria-label={t('translation:hero.search.placeholder')}
            InputProps={{
              endAdornment: <SearchIcon />,
              sx: {
                borderRadius: 4,
                backgroundColor: 'background.paper',
                maxWidth: 400
              }
            }}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </Stack>
        <Box
          width={'100%'}
          display={'flex'}
          alignItems={'center'}
          justifyContent={'center'}
          my={2}
        >
          <UserTypeFilter
            userTypes={toolsByCategory?.userTypes ?? undefined}
            selectedUserTypes={selectedUserTypes}
            onUserTypesChange={setSelectedUserTypes}
          />
        </Box>
        <Grid container spacing={3}>
          {categoryTools.map((tool, index) => (
            <Grid item xs={12} sm={6} md={4} key={tool.path}>
              <Stack
                sx={{
                  backgroundColor: 'background.paper',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0,0,0,0.4)'
                    : '0 4px 12px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  height: '100%',
                  minHeight: '140px',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: theme.palette.background.hover,
                    transform: 'translateY(-3px)'
                  }
                }}
                onClick={() => navigate('/' + tool.path)}
                direction={'row'}
                alignItems={'center'}
                spacing={3}
                p={{ xs: 2.5, sm: 3.5 }}
                border={`1.5px solid ${theme.palette.divider}`}
                borderRadius={4}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon
                    icon={tool.icon ?? 'ph:compass-tool-thin'}
                    fontSize={'54px'}
                    color={categoriesColors[index % categoriesColors.length]}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <StyledLink
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      lineHeight: 1.3,
                      textDecoration: 'none'
                    }}
                    to={'/' + tool.path}
                  >
                    {/*@ts-ignore*/}
                    {t(tool.name)}
                  </StyledLink>
                  <Typography sx={{ mt: 1, fontSize: 15.5, color: 'text.secondary', lineHeight: 1.6, fontWeight: 500 }}>
                    {/*@ts-ignore*/}
                    {t(tool.shortDescription)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
