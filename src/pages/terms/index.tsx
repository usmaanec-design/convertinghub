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

export default function TermsAndConditions() {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/terms-of-service`;
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
        title="ConvertingHub Terms of Service"
        description="Official Terms of Service for ConvertingHub online PDF and document conversion platform. Details acceptable use, subscriptions, billing, and software service agreements."
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
          <Typography color="text.primary">Terms of Service</Typography>
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
            Terms of Service
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            fontWeight={600}
            gutterBottom
          >
            ConvertingHub Software &amp; Digital Services Agreement
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
                1. Acceptance of Terms
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                By accessing, browsing, or using ConvertingHub (&quot;ConvertingHub&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) via https://convertinghub-official.web.app or associated mobile/desktop applications, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                2. Services Provided &amp; Digital Product Nature
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub is an online digital platform that provides users with simple and convenient PDF and document conversion tools. Users can convert PDF files to different formats, such as Word, Excel, PowerPoint, and images, as well as convert supported documents and images into PDF format. The platform is designed to make document conversion quick and easy through a web-based service. We only provide digital software services and do not sell physical products.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Standard productivity and document conversion tools are provided free of charge to all web users. Advanced conversions (such as high-fidelity PDF to Word and PDF to Excel) are provided through free daily token allowances or paid Pro subscription tiers.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                3. Subscriptions, Billing &amp; Merchant of Record (Paddle)
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Our order process and paid subscription services are conducted and managed by our online reseller and Merchant of Record, <strong>Paddle.com Market Limited (&quot;Paddle&quot;)</strong>.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                When you purchase a ConvertingHub Pro subscription, Paddle is the Merchant of Record for all orders. Paddle handles all customer service inquiries, billing transactions, local taxes (VAT/GST/Sales Tax), and payment card processing in compliance with PCI-DSS standards.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Subscriptions auto-renew on a recurring monthly or annual schedule until cancelled by the user. You can manage or cancel your subscription at any time using the Customer Portal link in Account Settings or by contacting Paddle/ConvertingHub support.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                4. Refund &amp; Cancellation Terms
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We offer a 14-day money-back guarantee for all initial Pro subscription purchases. If you are unsatisfied with our digital software services for any reason within 14 days of purchase, you may request a full refund by contacting{' '}
                <MuiLink href="mailto:it.expert.usmaan@gmail.com">
                  it.expert.usmaan@gmail.com
                </MuiLink>{' '}
                or visiting our separate{' '}
                <MuiLink component={RouterLink} to="/refund-policy">
                  Refund Policy page
                </MuiLink>.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                5. Acceptable Usage &amp; Content Security
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                You retain complete ownership of all files and documents you upload to ConvertingHub. You agree not to upload files that contain malware, illegal material, or violate third-party copyright or intellectual property rights. ConvertingHub automatically deletes server-processed files immediately post-conversion.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                6. Intellectual Property
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                All trademarks, logos, brand assets, source code, visual interfaces, and platform features remain the exclusive property of ConvertingHub. You are granted a limited, non-exclusive, revocable license to access the web application for personal or internal business use.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                7. Limitation of Liability
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub digital services are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. In no event shall ConvertingHub or Paddle be liable for indirect, incidental, or consequential damages arising from service usage or temporary interruption.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                8. Contact Information
              </Typography>
              <Typography variant="body1" color="text.secondary">
                For questions regarding these Terms of Service or billing inquiries, please contact our support team at:{' '}
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
