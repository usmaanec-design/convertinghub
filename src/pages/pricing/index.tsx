import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import { PRICING_TIERS, Tier, BUSINESS_EMAIL } from '../../config/pricing';
import { getPaddleInstance } from '../../config/paddle';
import { useAuth } from '../../contexts/AuthContext';
import { Paddle, PricePreviewResponse } from '@paddle/paddle-js';

import SEOHead from 'components/SEOHead';
import { getSiteUrl } from 'seo/seoConfig';

interface PricePreviewState {
  [priceId: string]: {
    formattedTotal: string;
    formattedSubtotal?: string;
  };
}

interface PricingPageProps {
  serverCountryCode?: string;
}

export default function PricingPage({ serverCountryCode }: PricingPageProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/pricing`;

  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const [loadingPrices, setLoadingPrices] = useState<boolean>(true);
  const [priceData, setPriceData] = useState<PricePreviewState>({});
  const [error, setError] = useState<string | null>(null);

  const getValidCountryCode = (): string | undefined => {
    if (!serverCountryCode) return undefined;
    const cleanCode = serverCountryCode.trim().toUpperCase();
    if (
      cleanCode === 'OTHERS' ||
      cleanCode === 'UNKNOWN' ||
      cleanCode.length !== 2
    ) {
      return undefined;
    }
    return cleanCode;
  };

  useEffect(() => {
    let isMounted = true;
    getPaddleInstance()
      .then((instance) => {
        if (isMounted) {
          setPaddle(instance);
        }
      })
      .catch((err) => {
        console.error('[PricingPage] Paddle initialization notice:', err);
        if (isMounted) {
          setLoadingPrices(false);
          if (err?.message) {
            setError(err.message);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!paddle) return;

    let isMounted = true;
    setLoadingPrices(true);

    const proTier = PRICING_TIERS.find((t) => t.id === 'pro');
    const proPriceId = proTier?.priceId;

    if (!proPriceId || proPriceId.includes('YOUR_PADDLE_')) {
      setLoadingPrices(false);
      return;
    }

    const validCountryCode = getValidCountryCode();

    paddle
      .PricePreview({
        items: [{ priceId: proPriceId, quantity: 1 }],
        address: validCountryCode ? { countryCode: validCountryCode } : undefined
      })
      .then((result: PricePreviewResponse) => {
        if (!isMounted) return;

        const newPriceData: PricePreviewState = {};

        if (result?.data?.details?.lineItems) {
          result.data.details.lineItems.forEach((item) => {
            newPriceData[item.price.id] = {
              formattedTotal: item.formattedTotals.total,
              formattedSubtotal: item.formattedTotals.subtotal
            };
          });
        }

        setPriceData(newPriceData);
        setLoadingPrices(false);
      })
      .catch((err) => {
        console.warn('[PricingPage] Paddle.PricePreview notice:', err);
        if (isMounted) {
          setLoadingPrices(false);
        }
      });
  }, [paddle, serverCountryCode]);

  const handleSubscribePro = async (tier: Tier) => {
    const selectedPriceId = tier.priceId;

    if (!selectedPriceId || selectedPriceId.includes('YOUR_PADDLE_')) {
      setError(
        'Paddle Live Pro Price ID is missing. Please configure VITE_PADDLE_PRO_PRICE_ID in your environment.'
      );
      return;
    }

    try {
      const paddleInstance = paddle || (await getPaddleInstance());

      if (!paddleInstance) {
        throw new Error('Paddle checkout is currently unavailable.');
      }

      const successUrl = `${window.location.origin}/welcome`;

      const checkoutOptions: any = {
        items: [{ priceId: selectedPriceId, quantity: 1 }],
        settings: {
          displayMode: 'overlay',
          variant: 'one-page',
          theme: 'light',
          successUrl
        }
      };

      if (user?.email && typeof user.email === 'string' && user.email.trim().length > 0) {
        checkoutOptions.customer = { email: user.email.trim() };
      }

      console.log('[PricingPage] Opening Paddle Checkout with options:', checkoutOptions);
      paddleInstance.Checkout.open(checkoutOptions);
    } catch (err: any) {
      console.error('[PricingPage] Checkout error:', err);
      setError(err?.message || 'Failed to open Paddle Checkout.');
    }
  };

  const getBusinessMailtoLink = () => {
    const subject = encodeURIComponent('Business Plan Inquiry - ConvertingHub');
    const body = encodeURIComponent(
      'Hello ConvertingHub Team,\n\nI would like to inquire about the Business Plan for ConvertingHub.\n\nCompany/Project Name:\nExpected Monthly Conversions:\nSpecific Requirements:\n\nBest regards,'
    );
    return `mailto:${BUSINESS_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        px: { xs: 2, sm: 4 },
        backgroundColor: 'background.default',
        minHeight: '80vh'
      }}
    >
      <SEOHead
        title="ConvertingHub Pricing & Subscription Plans"
        description="Explore ConvertingHub free and Pro subscription plans for PDF and document conversion. Transparent pricing powered by Paddle."
        canonicalUrl={canonicalUrl}
      />
      <Container maxWidth="lg">
        {/* Header */}
        <Stack spacing={2} textAlign="center" alignItems="center" mb={6}>
          <Chip
            label="Simple & Transparent"
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700, px: 1 }}
          />
          <Typography
            variant="h3"
            component="h1"
            fontWeight={800}
            sx={{
              fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
              letterSpacing: '-1px'
            }}
          >
            ConvertingHub Plans
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 640, fontWeight: 400 }}
          >
            All standard file tools are 100% Free & Unlimited. Upgrade to Pro for
            PDF to Word and PDF to Excel conversion.
          </Typography>
        </Stack>

        {/* Global Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 4, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Pricing Cards Grid */}
        <Grid container spacing={4} alignItems="stretch">
          {PRICING_TIERS.map((tier) => {
            const isPro = tier.id === 'pro';
            const isStarter = tier.id === 'starter';
            const isBusiness = tier.id === 'business';
            const priceInfo = isPro && tier.priceId ? priceData[tier.priceId] : null;

            return (
              <Grid key={tier.id} item xs={12} md={4} style={{ display: 'flex' }}>
                <Card
                  elevation={tier.isPopular ? 8 : 1}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '100%',
                    borderRadius: 4,
                    position: 'relative',
                    border: tier.isPopular
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.divider}`,
                    transition:
                      'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                >
                  {tier.isPopular && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 24,
                        transform: 'translateY(-50%)'
                      }}
                    >
                      <Chip
                        icon={<StarIcon sx={{ fontSize: '1rem !important' }} />}
                        label="Most Popular"
                        color="primary"
                        sx={{ fontWeight: 700, px: 1 }}
                      />
                    </Box>
                  )}

                  <CardContent sx={{ p: 4, flexGrow: 1 }}>
                    {/* Plan Header */}
                    <Typography
                      variant="h5"
                      component="h2"
                      fontWeight={800}
                      gutterBottom
                    >
                      {tier.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ minHeight: 40, mb: 3 }}
                    >
                      {tier.description}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    {/* Price Display */}
                    <Box sx={{ my: 3, minHeight: 64 }}>
                      {isStarter && (
                        <Box>
                          <Typography
                            variant="h3"
                            component="span"
                            fontWeight={800}
                            sx={{ color: 'text.primary' }}
                          >
                            Free
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            display="block"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            Unlimited free access to all standard tools
                          </Typography>
                        </Box>
                      )}

                      {isPro && (
                        <Box>
                          {loadingPrices ? (
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <CircularProgress size={24} />
                              <Typography variant="body2" color="text.secondary">
                                Loading price...
                              </Typography>
                            </Stack>
                          ) : (
                            <Box>
                              <Typography
                                variant="h3"
                                component="span"
                                fontWeight={800}
                                sx={{ color: 'text.primary' }}
                              >
                                {priceInfo?.formattedTotal || '$1.00'}
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                component="span"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                / month
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {isBusiness && (
                        <Box>
                          <Typography
                            variant="h4"
                            component="span"
                            fontWeight={800}
                            sx={{ color: 'text.primary' }}
                          >
                            Contact Us
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            display="block"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            Custom pricing & dedicated workflows
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Features List */}
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{
                        mb: 1.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Included Features:
                    </Typography>
                    <List disablePadding>
                      {tier.features.map((feature, idx) => {
                        const isNotIncluded =
                          feature.includes('requires Pro');
                        return (
                          <ListItem key={idx} disableGutters sx={{ py: 0.75 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircleIcon
                                color={isNotIncluded ? 'action' : 'primary'}
                                fontSize="small"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={feature}
                              primaryTypographyProps={{
                                variant: 'body2',
                                color: isNotIncluded
                                  ? 'text.secondary'
                                  : 'text.primary',
                                fontWeight: isNotIncluded ? 400 : 500
                              }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>

                  <CardActions sx={{ p: 4, pt: 0 }}>
                    {isStarter && (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="inherit"
                        size="large"
                        disabled
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '1rem'
                        }}
                      >
                        Default Free Plan
                      </Button>
                    )}

                    {isPro && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={() => handleSubscribePro(tier)}
                        startIcon={<LockIcon fontSize="small" />}
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '1rem'
                        }}
                      >
                        Subscribe to Pro
                      </Button>
                    )}

                    {isBusiness && (
                      <Button
                        fullWidth
                        component="a"
                        href={getBusinessMailtoLink()}
                        variant="outlined"
                        color="primary"
                        size="large"
                        startIcon={<EmailIcon fontSize="small" />}
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '1rem'
                        }}
                      >
                        Contact for Business Plan
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Security Note */}
        <Paper
          elevation={0}
          sx={{
            mt: 8,
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.02)'
                : 'rgba(0,0,0,0.02)'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            🔒 Secure checkout powered by Paddle. Encrypted payments, 256-bit SSL protection.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
