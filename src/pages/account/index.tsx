import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Grid
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getBackendUrl } from '../../utils/backendConfig';

export default function AccountPage() {
  const { user, isAuthenticated, signInWithGoogle } = useAuth();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPortal = async () => {
    if (!user || !user.email) return;

    setLoadingPortal(true);
    setError(null);

    try {
      // Send auth token / email to backend endpoint for server-side customer ID resolution
      const response = await fetch(getBackendUrl('/api/paddle/portal-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.email}`
        },
        body: JSON.stringify({ email: user.email })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error ||
            'Failed to generate customer portal session. Please make sure you have an active subscription.'
        );
      }

      // Redirect user to Paddle-hosted self-service portal
      window.location.href = data.url;
    } catch (err: any) {
      console.error('[AccountPage] Customer portal session error:', err);
      setError(err?.message || 'Failed to open billing portal.');
      setLoadingPortal(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={2}
            sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}
          >
            <AccountCircleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Sign In to Access Your Account
            </Typography>
            <Typography color="text.secondary" paragraph>
              Please sign in with your account to view your subscription details and manage billing.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={signInWithGoogle}
              sx={{ borderRadius: 100, px: 4, py: 1.25, fontWeight: 700 }}
            >
              Sign In with Google
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        px: { xs: 2, sm: 4 },
        backgroundColor: 'background.default',
        minHeight: '80vh'
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" fontWeight={800} gutterBottom>
          Account Settings & Subscription
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Manage your account profile, subscription plan, payment methods, and invoices.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* User Profile Card */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={1}
              sx={{
                p: 4,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Avatar
                src={user.photoURL || undefined}
                alt={user.displayName || 'User'}
                sx={{
                  width: 80,
                  height: 80,
                  mb: 2,
                  border: '3px solid',
                  borderColor: 'primary.main'
                }}
              >
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={800}>
                {user.displayName || 'Subscribed User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Chip
                icon={<VerifiedIcon />}
                label="Account Verified"
                color="success"
                size="small"
                variant="outlined"
                sx={{ mt: 1, fontWeight: 700 }}
              />
            </Paper>
          </Grid>

          {/* Subscription & Customer Portal Card */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={1}
              sx={{
                p: 4,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between'
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <CreditCardIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>
                    Billing & Self-Service Portal
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Access your Paddle-hosted customer portal to update your payment method, view invoices, download receipts, or adjust your plan.
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
                  Your subscription status and payment methods are securely managed via Paddle.
                </Alert>
              </Box>

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleOpenPortal}
                  disabled={loadingPortal}
                  endIcon={
                    loadingPortal ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <OpenInNewIcon />
                    )
                  }
                  sx={{
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    flexGrow: 1
                  }}
                >
                  {loadingPortal
                    ? 'Generating Portal Link...'
                    : 'Manage Subscription & Billing'}
                </Button>
                <Button
                  component={Link}
                  to="/pricing"
                  variant="outlined"
                  color="inherit"
                  size="large"
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                >
                  Pricing
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
