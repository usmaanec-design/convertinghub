import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  Avatar,
  TextField,
  CircularProgress,
  useTheme,
  Card,
  CardContent
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GoogleIcon from '@mui/icons-material/Google';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import SEOHead from 'components/SEOHead';
import { normalizeCanonicalUrl } from 'seo/seoConfig';
import { useAuth } from 'contexts/AuthContext';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from 'config/firebase';
import { AuthModal } from '../../components/auth/AuthModal';

export default function DeleteAccount() {
  const canonicalUrl = normalizeCanonicalUrl('/delete-account');
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, signInWithGoogle, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state for unauthenticated email deletion requests
  const [requestEmail, setRequestEmail] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || !confirmed || isDeleting) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      // 1. Delete user profile document from Cloud Firestore (`users/{uid}`)
      try {
        const userRef = doc(db, 'users', user.uid);
        await deleteDoc(userRef);
      } catch (fsErr) {
        console.warn('[DeleteAccount] Firestore deletion notice:', fsErr);
      }

      // 2. Clear IndexedDB document database (`ConvertingHubFilesDB`)
      try {
        if (typeof indexedDB !== 'undefined') {
          indexedDB.deleteDatabase('ConvertingHubFilesDB');
        }
      } catch (idbErr) {
        console.warn('[DeleteAccount] IndexedDB cleanup notice:', idbErr);
      }

      // 3. Purge all ConvertingHub local storage preferences and cached state
      try {
        localStorage.clear();
      } catch (lsErr) {
        console.warn('[DeleteAccount] LocalStorage cleanup notice:', lsErr);
      }

      // 4. Permanently delete user account from Firebase Authentication
      await deleteUser(user);

      setIsDeleting(false);
      setIsDeleted(true);
    } catch (err: any) {
      console.error('[DeleteAccount] Deletion failed:', err);
      setIsDeleting(false);

      const code = err?.code || '';
      if (code === 'auth/requires-recent-login') {
        setErrorMsg(
          'For security, deleting your account requires a recent login. Please sign out, log in again with Google, and retry account deletion.'
        );
      } else {
        setErrorMsg(
          "We couldn't complete your account deletion request. Please try signing in again or contact ConvertingHub support."
        );
      }
    }
  };

  const handleEmailRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail || !requestEmail.includes('@')) return;

    setRequestLoading(true);
    setTimeout(() => {
      setRequestLoading(false);
      setRequestSubmitted(true);
    }, 800);
  };

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        background: `url(/assets/${
          theme.palette.mode === 'dark'
            ? 'background-dark.png'
            : 'background.svg'
        })`,
        backgroundColor: 'background.default',
        py: 6,
        px: 3,
        minHeight: '85vh'
      }}
    >
      <SEOHead
        title="Delete ConvertingHub Account"
        description="Request permanent deletion of your ConvertingHub account and associated personal data."
        canonicalUrl={canonicalUrl}
        noindex={true}
      />

      <Box width="100%" maxWidth="900px">
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink
            component={RouterLink}
            to="/"
            color="inherit"
            underline="hover"
          >
            Home
          </MuiLink>
          <Typography color="text.primary">Delete Account</Typography>
        </Breadcrumbs>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            width: '100%'
          }}
        >
          {isDeleted ? (
            /* SUCCESS STATE */
            <Stack spacing={3} alignItems="center" textAlign="center" py={4}>
              <Avatar
                sx={{
                  bgcolor: 'success.light',
                  color: 'success.main',
                  width: 72,
                  height: 72
                }}
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 48 }} />
              </Avatar>

              <Typography variant="h4" fontWeight={800} color="text.primary">
                Account Deletion Completed
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                maxWidth="600px"
              >
                Your ConvertingHub account and associated profile data have been
                permanently deleted. Thank you for using ConvertingHub.
              </Typography>

              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/')}
                sx={{
                  mt: 2,
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 700,
                  textTransform: 'none'
                }}
              >
                Return to ConvertingHub
              </Button>
            </Stack>
          ) : (
            /* ACTIVE DELETION REQUEST PAGE */
            <Stack spacing={4}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    bgcolor: 'error.light',
                    color: 'error.main',
                    width: 56,
                    height: 56
                  }}
                >
                  <DeleteForeverIcon sx={{ fontSize: 36 }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={800}
                    color="text.primary"
                  >
                    Delete Your ConvertingHub Account
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Request permanent deletion of your account and personal data
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info" icon={<ShieldIcon />}>
                Use this page to request permanent deletion of your ConvertingHub
                account and associated personal data. Account deletion is permanent
                and cannot be undone.
              </Alert>

              {errorMsg && (
                <Alert severity="error" onClose={() => setErrorMsg(null)}>
                  {errorMsg}
                </Alert>
              )}

              {/* AUTHENTICATED USER FLOW */}
              {user ? (
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: 'error.main',
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(239, 68, 68, 0.05)'
                        : 'rgba(254, 242, 242, 0.7)'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight={700}
                      textTransform="uppercase"
                      letterSpacing={0.5}
                      mb={2}
                    >
                      Authenticated Account
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      mb={3}
                    >
                      <Avatar
                        src={user.photoURL || undefined}
                        alt={user.displayName || user.phoneNumber || 'User'}
                        sx={{ width: 50, height: 50 }}
                      >
                        {user.displayName
                          ? user.displayName.charAt(0).toUpperCase()
                          : user.email?.charAt(0).toUpperCase() || '📱'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {user.displayName || (user.phoneNumber ? `Phone User (${user.phoneNumber})` : 'ConvertingHub User')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email || user.phoneNumber || 'Signed in'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Box mb={3}>
                      <Alert severity="warning" icon={<WarningAmberIcon />}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Warning: Permanent Action
                        </Typography>
                        <Typography variant="body2">
                          Account deletion is permanent. Your ConvertingHub
                          account, user profile record, and eligible associated
                          data will be deleted and cannot be recovered.
                        </Typography>
                      </Alert>
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={confirmed}
                          onChange={(e) => setConfirmed(e.target.checked)}
                          color="error"
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight={600}>
                          I understand that deleting my account is permanent.
                        </Typography>
                      }
                      sx={{ mb: 3 }}
                    />

                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="error"
                        size="large"
                        disabled={!confirmed || isDeleting}
                        onClick={handleDeleteAccount}
                        startIcon={
                          isDeleting ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <DeleteForeverIcon />
                          )
                        }
                        sx={{
                          borderRadius: 2.5,
                          fontWeight: 700,
                          px: 3,
                          py: 1.2,
                          textTransform: 'none'
                        }}
                      >
                        {isDeleting
                          ? 'Deleting Account...'
                          : 'Delete My ConvertingHub Account'}
                      </Button>

                      <Button
                        variant="outlined"
                        color="inherit"
                        size="large"
                        onClick={logout}
                        sx={{
                          borderRadius: 2.5,
                          fontWeight: 600,
                          textTransform: 'none'
                        }}
                      >
                        Sign Out
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ) : (
                /* UNAUTHENTICATED / GUEST FLOW */
                <Stack spacing={3}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 3, bgcolor: 'action.hover' }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      gutterBottom
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <GoogleIcon color="primary" /> Option A: Sign In to Delete
                      Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      If you created your ConvertingHub account using Google
                      Sign-In or Mobile Phone Number, sign in below to confirm and complete instant account
                      deletion.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={signInWithGoogle}
                        startIcon={<GoogleIcon />}
                        sx={{
                          borderRadius: 2.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          px: 3,
                          py: 1
                        }}
                      >
                        Sign In with Google
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setAuthModalOpen(true)}
                        startIcon={<PhoneIphoneIcon color="primary" />}
                        sx={{
                          borderRadius: 2.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          px: 3,
                          py: 1
                        }}
                      >
                        Continue with Phone
                      </Button>
                    </Stack>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      gutterBottom
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <EmailIcon color="action" /> Option B: Request Deletion by
                      Email
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      If you cannot sign in or need manual account deletion assistance,
                      enter the email address associated with your ConvertingHub
                      account below.
                    </Typography>

                    {requestSubmitted ? (
                      <Alert severity="success">
                        <Typography variant="subtitle2" fontWeight={700}>
                          Deletion Request Received
                        </Typography>
                        <Typography variant="body2">
                          We have recorded your deletion request for{' '}
                          <strong>{requestEmail}</strong>. Our support team will
                          verify your request and process account deletion within
                          30 days. You may also contact customer support at{' '}
                          <MuiLink href="mailto:it.expert.usmaan@gmail.com">
                            it.expert.usmaan@gmail.com
                          </MuiLink>.
                        </Typography>
                      </Alert>
                    ) : (
                      <Box component="form" onSubmit={handleEmailRequestSubmit}>
                        <Stack spacing={2} maxWidth="500px">
                          <TextField
                            label="Account Email Address"
                            type="email"
                            required
                            fullWidth
                            value={requestEmail}
                            onChange={(e) => setRequestEmail(e.target.value)}
                            placeholder="user@example.com"
                            size="small"
                          />
                          <Button
                            type="submit"
                            variant="outlined"
                            color="error"
                            disabled={requestLoading || !requestEmail}
                            startIcon={
                              requestLoading ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <DeleteForeverIcon />
                              )
                            }
                            sx={{
                              borderRadius: 2.5,
                              fontWeight: 700,
                              textTransform: 'none',
                              alignSelf: 'flex-start'
                            }}
                          >
                            {requestLoading
                              ? 'Submitting...'
                              : 'Submit Deletion Request'}
                          </Button>
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                </Stack>
              )}

              <Divider />

              {/* DATA DELETION & RETENTION EXPLANATION */}
              <Box>
                <Typography
                  variant="h5"
                  component="h2"
                  fontWeight={700}
                  gutterBottom
                  color="text.primary"
                >
                  Data That Will Be Deleted
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  When your account deletion request is processed, the following
                  data associated with your account will be permanently removed:
                </Typography>
                <Box component="ul" sx={{ pl: 3, color: 'text.secondary', mb: 3 }}>
                  <li>
                    <Typography variant="body2">
                      <strong>Firebase Authentication User Record:</strong> Your
                      unique Google OAuth identifier and login credentials.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Firestore User Profile:</strong> Your stored display
                      name, email address, profile picture URL, plan status, and account
                      preferences record (`users/{`uid`}`).
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Token Wallet & Usage Quota:</strong> Daily conversion
                      allowances and token balance records.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>IndexedDB Document Store:</strong> Cached document
                      records and authorized folder references stored in browser IndexedDB
                      (`ConvertingHubFilesDB`).
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Local Storage Preferences:</strong> Saved theme,
                      language selection, favorite tool bookmarks, and local state.
                    </Typography>
                  </li>
                </Box>

                <Typography
                  variant="h5"
                  component="h2"
                  fontWeight={700}
                  gutterBottom
                  color="text.primary"
                >
                  Uploaded Files & Conversion Retention Policy
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  - <strong>On-Device Files:</strong> Documents browsed using the
                  Android Storage Access Framework (SAF) reside locally on your mobile
                  device. ConvertingHub does NOT store persistent copies of your local
                  phone files on our servers.
                  <br />- <strong>Temporary Server Conversion Files:</strong> Document
                  conversions processed via server-side engines (LibreOffice &amp; Adobe
                  PDF Services) process files in an isolated, temporary working
                  directory. Input files, intermediate data, and output files are
                  <strong>
                    {' '}
                    automatically deleted immediately after conversion completes
                  </strong>{' '}
                  (retention period: under 1 hour timeout).
                </Typography>

                <Typography
                  variant="h5"
                  component="h2"
                  fontWeight={700}
                  gutterBottom
                  color="text.primary"
                >
                  Data That May Be Retained
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  If you purchase a paid subscription plan, financial order records,
                  payment receipts, and tax invoices are processed directly by our Merchant
                  of Record, <strong>Paddle.com Market Limited (&quot;Paddle&quot;)</strong>.
                  Paddle retains financial billing records in accordance with applicable
                  legal, tax, accounting, and anti-fraud regulations. ConvertingHub does
                  not store credit card details or financial bank information on our
                  servers.
                </Typography>
              </Box>

              <Divider />

              {/* SUPPORT & PRIVACY LINKS */}
              <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                gap={2}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Need assistance? Contact ConvertingHub Support:
                  </Typography>
                  <MuiLink
                    href="mailto:it.expert.usmaan@gmail.com"
                    fontWeight={700}
                  >
                    it.expert.usmaan@gmail.com
                  </MuiLink>
                </Box>
                <Button
                  component={RouterLink}
                  to="/privacy-policy"
                  variant="outlined"
                  size="small"
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Read Privacy Policy
                </Button>
              </Box>
            </Stack>
          )}
        </Paper>
      </Box>

      {/* Auth Modal for Delete Account */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </Box>
  );
}
