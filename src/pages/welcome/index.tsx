import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Chip
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function WelcomePage() {
  useEffect(() => {
    try {
      localStorage.setItem('convertinghub_is_pro_user', 'true');
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('[WelcomePage] Failed to set Pro access in localStorage:', e);
    }
  }, []);

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        px: 2,
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default'
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={4}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <CheckCircleOutlineIcon
              color="success"
              sx={{ fontSize: 80, filter: 'drop-shadow(0px 4px 10px rgba(76,175,80,0.3))' }}
            />
          </Box>

          <Chip
            label="Payment Successful"
            color="success"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700, mb: 2 }}
          />

          <Typography variant="h4" component="h1" fontWeight={800} gutterBottom>
            Welcome Aboard! 🎉
          </Typography>

          <Typography color="text.secondary" paragraph sx={{ mb: 4 }}>
            Thank you for subscribing! Your transaction was processed successfully via
            Paddle Sandbox. You now have full access to all features included in your plan.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              to="/"
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ py: 1.5, px: 4, borderRadius: 100, fontWeight: 700, textTransform: 'none' }}
            >
              Start Converting Tools
            </Button>
            <Button
              component={Link}
              to="/pricing"
              variant="outlined"
              color="inherit"
              size="large"
              sx={{ py: 1.5, px: 4, borderRadius: 100, fontWeight: 700, textTransform: 'none' }}
            >
              View Pricing
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
