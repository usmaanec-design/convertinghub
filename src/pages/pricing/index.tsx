import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Switch,
  Typography,
  useTheme,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import { initializePaddle, Paddle } from '@paddle/paddle-js'
import { TIERS } from './tiers'
import { useAuth } from '../../contexts/AuthContext'

// ---------------------------------------------------------------------------
// Env-var validation — fail loudly so we never hit the wrong Paddle account.
// ---------------------------------------------------------------------------
const PADDLE_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string
const PADDLE_ENV = import.meta.env.VITE_PADDLE_ENVIRONMENT as
  | 'sandbox'
  | 'production'

if (!PADDLE_TOKEN) {
  throw new Error(
    '[Pricing] VITE_PADDLE_CLIENT_TOKEN is not set. ' +
      'Add it to your .env file and restart the dev server.',
  )
}
if (!PADDLE_ENV) {
  throw new Error(
    '[Pricing] VITE_PADDLE_ENVIRONMENT is not set. ' +
      'Set it to "sandbox" or "production" in your .env file.',
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Billing = 'month' | 'year'

interface PriceInfo {
  formatted: string
  loading: boolean
  error: boolean
}

type PriceMap = Record<string, PriceInfo>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PricingPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [billing, setBilling] = useState<Billing>('month')
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined)
  const [prices, setPrices] = useState<PriceMap>({})
  const [openingTier, setOpeningTier] = useState<string | null>(null)

  // Initialize Paddle once on mount; use eventCallback to navigate on success
  useEffect(() => {
    initializePaddle({
      environment: PADDLE_ENV,
      token: PADDLE_TOKEN,
      eventCallback(data) {
        if (data.name === 'checkout.completed') {
          navigate('/welcome')
        }
      },
    }).then((p) => {
      if (p) setPaddle(p)
    })
  }, [navigate])

  // Fetch localized prices whenever paddle is ready or billing changes
  const fetchPrices = useCallback(async () => {
    if (!paddle) return
    const ids = TIERS.map((t) => t.priceId[billing]).filter(Boolean)
    if (ids.length === 0) return

    // Mark all as loading
    setPrices((prev) => {
      const next = { ...prev }
      ids.forEach((id) => {
        next[id] = { formatted: '', loading: true, error: false }
      })
      return next
    })

    try {
      const result = await paddle.PricePreview({
        items: ids.map((id) => ({ priceId: id, quantity: 1 })),
        // No country code — Paddle auto-detects location from the visitor's IP.
        // (This is a pure SPA: no server-side request headers are available.)
      })

      const next: PriceMap = {}
      result.data.details.lineItems.forEach((item) => {
        next[item.price.id] = {
          formatted: item.formattedTotals.total,
          loading: false,
          error: false,
        }
      })
      setPrices(next)
    } catch {
      const ids2 = TIERS.map((t) => t.priceId[billing]).filter(Boolean)
      setPrices((prev) => {
        const next = { ...prev }
        ids2.forEach((id) => {
          next[id] = { formatted: '', loading: false, error: true }
        })
        return next
      })
    }
  }, [paddle, billing])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Open Paddle Checkout overlay
  // paddle.Checkout.open() is synchronous (returns void) — navigation on success
  // is handled via the `eventCallback` registered in initializePaddle above.
  const handleSubscribe = (priceId: string, tierName: string) => {
    if (!paddle || !priceId) return
    setOpeningTier(tierName)

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      settings: {
        displayMode: 'overlay',
        variant: 'one-page',
      },
      customer: user?.email ? { email: user.email } : undefined,
    })

    // open() fires the overlay; spinner can be cleared immediately
    setOpeningTier(null)
  }

  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        py: { xs: 6, md: 10 },
      }}
    >
      <Helmet title="Pricing — ConvertingHub" />

      <Container maxWidth="lg">
        {/* Heading */}
        <Stack alignItems="center" spacing={2} mb={6}>
          <Typography variant="h3" fontWeight={700} textAlign="center">
            Simple, transparent pricing
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            textAlign="center"
          >
            Choose the plan that fits your workflow. Upgrade or cancel anytime.
          </Typography>

          {/* Billing toggle */}
          <Stack direction="row" alignItems="center" spacing={1} mt={1}>
            <Typography
              variant="body2"
              color={billing === 'month' ? 'text.primary' : 'text.secondary'}
              fontWeight={billing === 'month' ? 600 : 400}
            >
              Monthly
            </Typography>
            <Switch
              checked={billing === 'year'}
              onChange={(_, checked) =>
                setBilling(checked ? 'year' : 'month')
              }
              color="primary"
              inputProps={{ 'aria-label': 'Toggle yearly billing' }}
            />
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography
                variant="body2"
                color={billing === 'year' ? 'text.primary' : 'text.secondary'}
                fontWeight={billing === 'year' ? 600 : 400}
              >
                Yearly
              </Typography>
              <Chip
                label="Save up to 20%"
                size="small"
                color="success"
                variant={billing === 'year' ? 'filled' : 'outlined'}
                sx={{ height: 20, fontSize: 11 }}
              />
            </Stack>
          </Stack>
        </Stack>

        {/* Tier cards */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          justifyContent="center"
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
        >
          {TIERS.map((tier) => {
            const priceId = tier.priceId[billing]
            const priceInfo = prices[priceId]
            const isHighlighted = tier.highlighted === true

            return (
              <Card
                key={tier.name}
                elevation={isHighlighted ? 8 : 1}
                sx={{
                  flex: 1,
                  maxWidth: { md: 360 },
                  border: isHighlighted
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: theme.shadows[isHighlighted ? 12 : 4],
                  },
                }}
              >
                {isHighlighted && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <Chip
                      label="Most popular"
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 700, px: 1 }}
                    />
                  </Box>
                )}

                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight={700}>
                      {tier.name}
                    </Typography>
                  }
                  subheader={
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {tier.description}
                    </Typography>
                  }
                  sx={{ pb: 0 }}
                />

                <CardContent>
                  {/* Price display */}
                  <Box mb={2} minHeight={56} display="flex" alignItems="center">
                    {!priceId ? (
                      <Typography variant="h4" fontWeight={700} color="warning.main">
                        Set price ID
                      </Typography>
                    ) : priceInfo?.loading || !priceInfo ? (
                      <CircularProgress size={28} />
                    ) : priceInfo.error ? (
                      <Typography variant="body2" color="error">
                        Could not load price
                      </Typography>
                    ) : (
                      <Stack direction="row" alignItems="baseline" spacing={0.5}>
                        <Typography variant="h4" fontWeight={700}>
                          {priceInfo.formatted}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          / {billing === 'month' ? 'mo' : 'yr'}
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Features */}
                  <Stack spacing={1} mb={3}>
                    {tier.features.map((feat) => (
                      <Stack key={feat} direction="row" spacing={1} alignItems="flex-start">
                        <CheckCircleOutlineIcon
                          fontSize="small"
                          color="success"
                          sx={{ mt: 0.2, flexShrink: 0 }}
                        />
                        <Typography variant="body2">{feat}</Typography>
                      </Stack>
                    ))}
                  </Stack>

                  {/* CTA */}
                  <Button
                    variant={isHighlighted ? 'contained' : 'outlined'}
                    fullWidth
                    size="large"
                    disabled={
                      !paddle ||
                      !priceId ||
                      !priceInfo ||
                      priceInfo.loading ||
                      priceInfo.error ||
                      openingTier === tier.name
                    }
                    onClick={() => handleSubscribe(priceId, tier.name)}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    {openingTier === tier.name ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      `Subscribe to ${tier.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      </Container>
    </Box>
  )
}
