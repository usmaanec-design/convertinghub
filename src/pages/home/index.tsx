import { Box, useTheme } from '@mui/material';
import Hero from 'components/Hero';
import Categories from './Categories';
import { Helmet } from 'react-helmet';

export default function Home() {
  const theme = useTheme();
  return (
    <Box
      padding={{
        xs: 1,
        md: 1.5,
        lg: 2
      }}
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
      <Helmet title={'ConvertingHub - Professional Document & PDF Tools'} />
      <Hero />
      <Box mt={2} width={'100%'} display={'flex'} justifyContent={'center'}>
        <Categories />
      </Box>
    </Box>
  );
}
