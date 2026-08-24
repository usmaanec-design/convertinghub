import {
  Box,
  Card,
  CardContent,
  Link,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { ToolCardProps } from './AllTools';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function ToolCard({
  title,
  description,
  link,
  icon
}: ToolCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  return (
    <Card
      onClick={() => navigate(link)}
      raised
      sx={{
        borderRadius: 3,
        bgcolor: 'background.darkSecondary',
        borderColor: 'background.darkSecondary',
        color: '#fff',
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0,0,0,0.5)'
            : '6px 6px 14px #b8b9be, -6px -6px 14px #fff',
        cursor: 'pointer',
        height: '100%',
        transition: 'all 0.25s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            pb: 1.5,
            borderBottom: '1px solid #ffffff30'
          }}
        >
          <Stack direction={'row'} spacing={1.5} alignItems={'center'}>
            <Icon icon={icon} fontSize={32} />
            <Typography variant="h6" component="h2" fontWeight={800}>
              {title}
            </Typography>
          </Stack>
          <Link href={link} underline="none" sx={{ color: '#fff' }}>
            <ChevronRightIcon />
          </Link>
        </Box>
        <Typography variant="body2" mt={2} color="rgba(255,255,255,0.85)" lineHeight={1.6}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
