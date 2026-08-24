import { Box, useTheme } from '@mui/material';
import Hero from 'components/Hero';
import Categories from './Categories';
import SEOHead from 'components/SEOHead';
import { getHomeSeoData } from 'seo/seoConfig';

export default function Home() {
  const theme = useTheme();
  const homeSeo = getHomeSeoData();

  return (
    <Box
      padding={2}
      sx={{
        background: `url(/assets/${
          theme.palette.mode === 'dark'
            ? 'background-dark.png'
            : 'background.svg'
        })`,
        backgroundColor: 'background.default'
      }}
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      justifyContent={'center'}
      width={'100%'}
    >
      <SEOHead
        title={homeSeo.title}
        description={homeSeo.description}
        canonicalUrl={homeSeo.canonicalUrl}
        ogImage={homeSeo.ogImage}
      />
      <Hero />
      <Box mt={2} width={'100%'} display={'flex'} justifyContent={'center'}>
        <Categories />
      </Box>
    </Box>
  );
}
