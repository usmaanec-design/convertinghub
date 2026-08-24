import { getToolsByCategory } from '@tools/index';
import Grid from '@mui/material/Grid';
import { Box, Card, CardContent, Stack, useTheme } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { categoriesColors } from 'config/uiConfig';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { getI18nNamespaceFromToolCategory } from '@utils/string';
import { useUserTypeFilter } from '../../providers/UserTypeFilterProvider';

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

const SingleCategory = function ({
  category,
  index
}: {
  category: ArrayElement<ReturnType<typeof getToolsByCategory>>;
  index: number;
}) {
  const { t } = useTranslation(getI18nNamespaceFromToolCategory(category.type));
  const navigate = useNavigate();
  const theme = useTheme();
  const [hovered, setHovered] = useState<boolean>(false);
  const toggleHover = () => setHovered((prevState) => !prevState);

  // Get translated category title and description
  const categoryTitle = t(`categories.${category.type}.title`, category.title);
  const categoryDescription = t(
    `categories.${category.type}.description`,
    category.description
  );
  const seeAllText = t('translation:categories.seeAll', 'See all {{title}}', {
    title: categoryTitle
  });
  const tryText = t('translation:categories.try', 'Try {{title}}', {
    //@ts-ignore
    title: t(category.example.title)
  });

  return (
    <Grid item xs={12} sm={6} md={4} onMouseEnter={toggleHover} onMouseLeave={toggleHover}>
      <Card
        elevation={hovered ? 6 : 1}
        sx={{
          height: '100%',
          borderRadius: 4,
          border: '1.5px solid',
          borderColor: hovered ? 'primary.main' : 'divider',
          backgroundColor: hovered ? 'background.hover' : 'background.paper',
          transition: 'all 0.25s ease-in-out',
          transform: hovered ? 'translateY(-3px)' : 'none'
        }}
      >
        <CardContent sx={{ height: '100%', p: { xs: 3, sm: 3.5 }, '&:last-child': { pb: 3.5 } }}>
          <Stack
            direction={'column'}
            height={'100%'}
            justifyContent={'space-between'}
            spacing={2.5}
          >
            <Box>
              <Stack direction={'row'} spacing={2} alignItems={'center'}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3.5,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon
                    icon={category.icon}
                    fontSize={'52px'}
                    style={{
                      transform: `scale(${hovered ? 1.08 : 1})`,
                      transition: 'transform 0.2s ease'
                    }}
                    color={categoriesColors[index % categoriesColors.length]}
                  />
                </Box>
                <Link
                  style={{
                    fontSize: 23,
                    fontWeight: 800,
                    lineHeight: 1.3,
                    textDecoration: 'none',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#0f172a'
                  }}
                  to={'/categories/' + category.type}
                >
                  {categoryTitle}
                </Link>
              </Stack>
              <Typography
                sx={{
                  mt: 2,
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              >
                {categoryDescription}
              </Typography>
            </Box>
            <Grid container spacing={2} mt={1}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  size="large"
                  sx={{
                    height: '100%',
                    fontSize: 14.5,
                    py: 1.2,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none'
                  }}
                  onClick={() => navigate('/categories/' + category.type)}
                  variant={'contained'}
                >
                  {seeAllText}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  sx={{
                    backgroundColor: 'background.default',
                    height: '100%',
                    fontSize: 14.5,
                    py: 1.2,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none'
                  }}
                  fullWidth
                  size="large"
                  onClick={() => navigate(category.example.path)}
                  variant={'outlined'}
                >
                  {tryText}
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default function Categories() {
  const { selectedUserTypes } = useUserTypeFilter();
  const { t } = useTranslation();
  const categories = getToolsByCategory(selectedUserTypes, t);

  return (
    <Box width="100%" px={{ xs: 1.5, sm: 3, md: 4 }}>
      <Grid container spacing={3}>
        {categories.map((category, index) => (
          <SingleCategory key={category.type} category={category} index={index} />
        ))}
      </Grid>
    </Box>
  );
}
