import { Box, Button, Container, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Helmet title="Welcome — ConvertingHub" />

      <Container maxWidth="sm">
        <Stack alignItems="center" spacing={3} textAlign="center">
          <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main' }} />

          <Typography variant="h4" fontWeight={700}>
            You're all set!
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Thank you for subscribing to ConvertingHub. Your account has been
            upgraded — you can start using your plan right away.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width="100%">
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigate('/')}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Go to tools
            </Button>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => navigate('/pricing')}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Back to pricing
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
