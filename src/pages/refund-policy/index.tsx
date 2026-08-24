import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SEOHead from 'components/SEOHead';
import { getSiteUrl } from 'seo/seoConfig';
import { useTranslation } from 'react-i18next';

export default function RefundPolicy() {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/refund-policy`;
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const isRtl =
    i18n.language === 'ar' ||
    i18n.language === 'ur' ||
    i18n.language?.startsWith('ur');

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        backgroundColor: 'background.default',
        py: 6,
        px: 3,
        minHeight: '80vh'
      }}
    >
      <SEOHead
        title="ConvertingHub Refund & Cancellation Policy"
        description="Official Refund & Cancellation Policy for ConvertingHub digital PDF and document conversion services. Explains 14-day money-back guarantee, cancellation steps, and Paddle billing support."
        canonicalUrl={canonicalUrl}
      />

      <Box width="100%" maxWidth="1100px" sx={{ dir: isRtl ? 'rtl' : 'ltr' }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink
            component={RouterLink}
            to="/"
            color="inherit"
            underline="hover"
          >
            {t('navbar.home', 'Home')}
          </MuiLink>
          <Typography color="text.primary">Refund Policy</Typography>
        </Breadcrumbs>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            width: '100%'
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            fontWeight={800}
            gutterBottom
            color="primary.main"
          >
            Refund &amp; Cancellation Policy
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            fontWeight={600}
            gutterBottom
          >
            Money-Back Guarantee &amp; Subscription Cancellation Policy
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 4 }}
          >
            Last Updated: August 21, 2026
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                1. Digital Service Nature &amp; 14-Day Money-Back Guarantee
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub is an online digital platform that provides users with simple and convenient PDF and document conversion tools. Users can convert PDF files to different formats, such as Word, Excel, PowerPoint, and images, as well as convert supported documents and images into PDF format. The platform is designed to make document conversion quick and easy through a web-based service. We only provide digital software services and do not sell physical products.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We stand behind the quality of our digital software services. If you purchase a paid subscription (ConvertingHub Pro) and are unsatisfied for any reason, you are entitled to a full 100% refund within 14 days of your initial purchase.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                2. Subscription Cancellation
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                You may cancel your recurring Pro subscription at any time with zero hassle. Upon cancellation, your account will remain active with full Pro access until the end of your current billing cycle. You will not be charged again.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                3. How to Request a Refund or Cancellation
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                - <strong>Self-Service Customer Portal:</strong> You can manage or cancel your subscription at any time via the Paddle Customer Portal link inside your Account Settings page.
                <br />- <strong>Email Support Request:</strong> To request a full refund within the 14-day guarantee period, simply send an email to{' '}
                <MuiLink href="mailto:it.expert.usmaan@gmail.com">
                  it.expert.usmaan@gmail.com
                </MuiLink>{' '}
                with your purchase email address or subscription reference ID.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Refunds are processed promptly by our Merchant of Record (Paddle) and will be returned to your original payment method within 3 to 5 business days.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                4. No Return of Physical Goods
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Because ConvertingHub provides exclusively digital software tools and online web services, no physical shipping or return of physical items is required. All digital subscription cancellations take effect immediately online.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                5. Contact &amp; Billing Support
              </Typography>
              <Typography variant="body1" color="text.secondary">
                For questions about refunds, billing, or subscription changes, please contact our support team at:{' '}
                <MuiLink href="mailto:it.expert.usmaan@gmail.com">
                  it.expert.usmaan@gmail.com
                </MuiLink>.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
