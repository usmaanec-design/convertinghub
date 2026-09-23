import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  InputAdornment,
  Alert,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { COUNTRY_CODES, CountryCode, DEFAULT_COUNTRY } from '../../utils/countryCodes';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
}

export const showAuthModalEvent = (options?: { title?: string; subtitle?: string }) => {
  window.dispatchEvent(new CustomEvent('openConvertingHubAuthModal', { detail: options }));
};

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  title = 'Sign In to ConvertingHub',
  subtitle = 'Sign in to access premium features, save your conversion history, and sync across devices.',
  onSuccess
}) => {
  const theme = useTheme();
  const { signInWithGoogle, sendPhoneOtp, verifyPhoneOtp, isSigningIn, authError, clearAuthError } = useAuth();

  // 'options' | 'phone_input' | 'otp_verify'
  const [step, setStep] = useState<'options' | 'phone_input' | 'otp_verify'>('options');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const cleanupRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        console.warn('[AuthModal] Recaptcha clear notice:', e);
      }
      recaptchaVerifierRef.current = null;
    }
    if (recaptchaContainerRef.current) {
      recaptchaContainerRef.current.innerHTML = '';
    }
  };

  // Clear states when dialog opens or closes
  useEffect(() => {
    if (!open) {
      setStep('options');
      setPhoneNumber('');
      setOtp('');
      setLocalError(null);
      setConfirmationResult(null);
      setResendCountdown(0);
      clearAuthError();
      cleanupRecaptcha();
    }
    return () => {
      cleanupRecaptcha();
    };
  }, [open]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    try {
      await signInWithGoogle();
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      // Auth error handled in context
    }
  };

  const getFullPhoneNumber = () => {
    const raw = phoneNumber.trim().replace(/^0+/, ''); // remove leading 0
    return `${selectedCountry.dialCode}${raw}`;
  };

  const initRecaptcha = (): RecaptchaVerifier => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    if (!recaptchaContainerRef.current) {
      throw new Error('reCAPTCHA container element is not ready.');
    }

    recaptchaContainerRef.current.innerHTML = '';

    const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setLocalError('reCAPTCHA expired. Please try sending OTP again.');
      }
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const handleSendOtp = async () => {
    setLocalError(null);
    clearAuthError();

    const cleanNumber = phoneNumber.trim();
    if (!cleanNumber || cleanNumber.length < 5) {
      setLocalError('Please enter a valid phone number.');
      return;
    }

    const fullPhone = getFullPhoneNumber();

    try {
      const verifier = initRecaptcha();
      const confirmation = await sendPhoneOtp(fullPhone, verifier);
      setConfirmationResult(confirmation);
      setStep('otp_verify');
      setResendCountdown(60);
    } catch (err: any) {
      console.warn('[AuthModal] sendPhoneOtp failed:', err);
      cleanupRecaptcha();
      const code = err?.code || '';
      let msg = 'Failed to send SMS code. Please verify your phone number.';
      if (code === 'auth/operation-not-allowed') {
        msg = 'Phone sign-in is not yet enabled in Firebase Console. Please enable "Phone" provider in Firebase Console > Authentication > Sign-in method.';
      } else if (code === 'auth/invalid-phone-number') {
        msg = 'Please enter a valid phone number with country code.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a few moments before trying again.';
      } else if (code === 'auth/captcha-check-failed') {
        msg = 'reCAPTCHA check failed. Please refresh and try again.';
      } else if (err?.message && !err.message.startsWith('Firebase: Error')) {
        msg = err.message;
      }
      setLocalError(msg);
    }
  };

  const handleVerifyOtp = async () => {
    setLocalError(null);
    clearAuthError();

    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }

    if (!confirmationResult) {
      setLocalError('Session expired. Please request a new verification code.');
      setStep('phone_input');
      return;
    }

    try {
      await verifyPhoneOtp(confirmationResult, cleanOtp);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.warn('[AuthModal] verifyPhoneOtp failed:', err);
      const code = err?.code || '';
      let msg = 'Incorrect verification code. Please check and try again.';
      if (code === 'auth/invalid-verification-code') {
        msg = 'Invalid 6-digit verification code. Please check SMS and try again.';
      } else if (code === 'auth/code-expired') {
        msg = 'Verification code has expired. Please request a new code.';
      } else if (err?.message && !err.message.startsWith('Firebase: Error')) {
        msg = err.message;
      }
      setLocalError(msg);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isSigningIn) return;
    await handleSendOtp();
  };

  return (
    <Dialog
      open={open}
      onClose={() => !isSigningIn && onClose()}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 12,
        sx: {
          borderRadius: 4,
          p: { xs: 2, sm: 3 },
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          background: theme.palette.mode === 'dark' ? '#181e29' : '#ffffff'
        }
      }}
    >
      {/* Invisible reCAPTCHA Anchor */}
      <div ref={recaptchaContainerRef} />

      {/* Header bar with Back / Close */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        {step !== 'options' ? (
          <IconButton
            size="small"
            disabled={isSigningIn}
            onClick={() => {
              setLocalError(null);
              clearAuthError();
              if (step === 'otp_verify') setStep('phone_input');
              else setStep('options');
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        ) : (
          <Box sx={{ width: 28 }} />
        )}

        <IconButton size="small" disabled={isSigningIn} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Top Icon Banner */}
      <Box display="flex" justifyContent="center" mb={1.5}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: step === 'options' ? 'primary.50' : 'primary.main',
            color: step === 'options' ? 'primary.main' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid',
            borderColor: 'primary.light',
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.25)'
          }}
        >
          {step === 'options' ? (
            <SecurityIcon fontSize="large" color="primary" />
          ) : (
            <PhoneIphoneIcon fontSize="large" />
          )}
        </Box>
      </Box>

      {/* Title */}
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.35rem', p: 0, pb: 1, letterSpacing: '-0.5px' }}>
        {step === 'options' && title}
        {step === 'phone_input' && 'Sign in with Phone'}
        {step === 'otp_verify' && 'Verify Your Phone'}
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
          {step === 'options' && subtitle}
          {step === 'phone_input' &&
            'Enter your phone number. We will send an SMS verification code to verify your account.'}
          {step === 'otp_verify' && (
            <span>
              We sent a 6-digit code to <strong>{getFullPhoneNumber()}</strong>.
            </span>
          )}
        </Typography>

        {/* Error Alert */}
        {(localError || authError) && (
          <Alert
            severity="error"
            onClose={() => {
              setLocalError(null);
              clearAuthError();
            }}
            sx={{ mb: 2, borderRadius: 2, textAlign: 'left', fontSize: '0.85rem' }}
          >
            {localError || authError}
          </Alert>
        )}

        {/* STEP 1: OPTIONS (Google or Phone) */}
        {step === 'options' && (
          <Stack spacing={2} width="100%">
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSigningIn}
              onClick={handleGoogleSignIn}
              startIcon={
                isSigningIn ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />
              }
              sx={{
                borderRadius: '100px',
                py: 1.3,
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                boxShadow: 3
              }}
            >
              {isSigningIn ? 'Connecting...' : 'Continue with Google'}
            </Button>

            <Divider sx={{ my: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                OR
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              size="large"
              disabled={isSigningIn}
              onClick={() => {
                setLocalError(null);
                clearAuthError();
                setStep('phone_input');
              }}
              startIcon={<PhoneIphoneIcon />}
              sx={{
                borderRadius: '100px',
                py: 1.3,
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                borderWidth: '1.5px',
                '&:hover': { borderWidth: '1.5px' }
              }}
            >
              Continue with Phone Number
            </Button>
          </Stack>
        )}

        {/* STEP 2: PHONE NUMBER INPUT */}
        {step === 'phone_input' && (
          <Stack spacing={2.5} width="100%">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Select
                value={selectedCountry.code}
                onChange={(e) => {
                  const found = COUNTRY_CODES.find((c) => c.code === e.target.value);
                  if (found) setSelectedCountry(found);
                }}
                disabled={isSigningIn}
                size="small"
                sx={{ width: '42%', borderRadius: 2 }}
              >
                {COUNTRY_CODES.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.flag} {c.dialCode}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                fullWidth
                size="small"
                type="tel"
                label="Mobile Number"
                placeholder="300 1234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isSigningIn}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendOtp();
                }}
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Standard SMS rates may apply. SMS OTP powered by Firebase Auth.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSigningIn || !phoneNumber.trim()}
              onClick={handleSendOtp}
              startIcon={isSigningIn ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{
                borderRadius: '100px',
                py: 1.3,
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                boxShadow: 3
              }}
            >
              {isSigningIn ? 'Sending SMS...' : 'Send Verification Code'}
            </Button>
          </Stack>
        )}

        {/* STEP 3: OTP VERIFY */}
        {step === 'otp_verify' && (
          <Stack spacing={2.5} width="100%">
            <TextField
              fullWidth
              size="medium"
              label="6-Digit Verification Code"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              disabled={isSigningIn}
              autoFocus
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '1.4rem', letterSpacing: '6px', fontWeight: 700 }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && otp.trim().length === 6) handleVerifyOtp();
              }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSigningIn || otp.trim().length < 6}
              onClick={handleVerifyOtp}
              startIcon={isSigningIn ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
              sx={{
                borderRadius: '100px',
                py: 1.3,
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                boxShadow: 3
              }}
            >
              {isSigningIn ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
              <Button
                variant="text"
                size="small"
                disabled={isSigningIn}
                onClick={() => {
                  setLocalError(null);
                  clearAuthError();
                  setStep('phone_input');
                }}
                sx={{ textTransform: 'none', fontSize: '0.82rem' }}
              >
                Change Number
              </Button>

              <Button
                variant="text"
                size="small"
                disabled={isSigningIn || resendCountdown > 0}
                onClick={handleResendOtp}
                sx={{ textTransform: 'none', fontSize: '0.82rem', fontWeight: 600 }}
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
              </Button>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};
