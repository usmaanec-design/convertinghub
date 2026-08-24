import React from 'react';
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
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SEOHead from 'components/SEOHead';
import { getSiteUrl } from 'seo/seoConfig';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicy() {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/privacy-policy`;
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const isRtl =
    i18n.language === 'ar' ||
    i18n.language === 'ur' ||
    i18n.language.startsWith('ur');

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
        minHeight: '80vh'
      }}
    >
      <SEOHead
        title="ConvertingHub Privacy Policy"
        description="Privacy Policy for ConvertingHub, covering data processing, file handling, security, third-party services, and user privacy."
        canonicalUrl={canonicalUrl}
        noindex={false}
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
          <Typography color="text.primary">Privacy Policy</Typography>
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
            Privacy Policy
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            fontWeight={600}
            gutterBottom
          >
            ConvertingHub Privacy Policy
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
            {/* Section 1 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                1. Introduction & Nature of Service
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub is an online digital platform that provides users with simple and convenient PDF and document conversion tools. Users can convert PDF files to different formats, such as Word, Excel, PowerPoint, and images, as well as convert supported documents and images into PDF format. The platform is designed to make document conversion quick and easy through a web-based service. We only provide digital software services and do not sell physical products.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                This Privacy Policy explains how information may be collected,
                used, processed, stored, and protected when you use
                ConvertingHub through our website
                (https://convertinghub-official.web.app), application, or
                supported services. By using ConvertingHub, you acknowledge and
                agree to the practices described in this Privacy Policy.
              </Typography>
            </Box>

            {/* Section 2 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                2. Information We Collect
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub collects only the minimum necessary information
                required to deliver file processing, authentication, and
                application functionality. We distinguish between the following
                categories of data:
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="text.primary"
                sx={{ mt: 2 }}
              >
                A. Files and Content Submitted for Processing
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Users may submit files for processing, including PDF documents,
                Microsoft Word (.doc/.docx), Excel spreadsheets (.xls/.xlsx),
                PowerPoint presentations (.ppt/.pptx), images (PNG, JPG, WEBP,
                HEIC, GIF), CSV files, JSON/XML data, and GIS/spatial formats
                (KML, Shapefile .shp/.dbf).
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="text.primary"
                sx={{ mt: 2 }}
              >
                B. Account Information
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                If you optionally choose to sign in using Google Sign-In
                (Firebase Authentication), we process basic profile information
                provided by Google (display name, email address, profile picture
                URL, and unique user identifier UID). Account creation is
                optional; guests can access conversion tools without logging in.
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="text.primary"
                sx={{ mt: 2 }}
              >
                C. Technical Information
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Standard server logs automatically process IP addresses,
                user-agent strings, request timestamps, and HTTP status codes
                for security, rate-limiting, and error debugging.
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="text.primary"
                sx={{ mt: 2 }}
              >
                D. Information Voluntarily Provided by Users
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                If you contact customer support or submit feedback, we receive
                your email address and message contents to assist you.
              </Typography>
            </Box>

            {/* Section 3 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                3. Personal Information
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Personal information processed by ConvertingHub is strictly
                limited to your email address, display name, profile photo, and
                user ID when using Google Authentication. When signed in, user
                profile metadata is synchronized to Google Cloud Firestore under
                your specific user document record.
              </Typography>
            </Box>

            {/* Section 4 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                4. Technical Information & Security Logs
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub automatically logs limited technical data strictly
                for reliability, debugging server crashes, defending against
                automated bot abuse, and maintaining API performance. Technical
                log entries are retained only as long as necessary for
                operational security.
              </Typography>
            </Box>

            {/* Section 5 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                5. Cookies and Local Storage
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub uses local browser storage (localStorage) to store
                non-sensitive preference settings, including:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
                <li>
                  <Typography variant="body1">
                    Theme preference (dark mode, light mode, or system default)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Language selection preference (e.g., English, Arabic, Urdu)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Guest tool usage counters for prompt displays
                  </Typography>
                </li>
              </Box>
              <Typography
                variant="body1"
                color="text.secondary"
                paragraph
                sx={{ mt: 2 }}
              >
                Firebase Authentication tokens are stored securely in browser
                IndexedDB/localStorage. ConvertingHub does NOT use third-party
                advertising cookies or ad tracking scripts.
              </Typography>
            </Box>

            {/* Section 6 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                6. How We Use Information
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Information is used exclusively to operate ConvertingHub,
                process requested document conversions, authenticate users,
                remember local settings, detect security abuse, and respond to
                technical support inquiries.
              </Typography>
            </Box>

            {/* Section 7 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                7. File Processing and Retention Architecture
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                File processing in ConvertingHub uses a hybrid architecture
                designed for privacy and speed:
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="text.primary"
                sx={{ mt: 2 }}
              >
                Local Client-Side Processing
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Tools such as image compression, image cropping, text
                formatting, CSV validation, JSON prettifying, and browser PDF
                operations run entirely inside your web browser using HTML5
                Canvas and JavaScript. Files processed client-side never leave
                your computer or device.
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="text.primary"
                sx={{ mt: 2 }}
              >
                Server-Side Processing & Immediate Deletion
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Document format conversions (such as PDF to PowerPoint, Word to
                PDF, PDF to Excel, PDF to Word) are processed on secure backend
                servers utilizing LibreOffice Headless and Adobe PDF Services
                SDK.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                <strong>Automated Deletion Guarantee:</strong> Uploaded files
                and converted output documents are assigned an isolated,
                temporary server working directory during processing. As soon as
                the conversion response is completed (or if an error occurs), an
                automated cleanup task forcefully deletes all input files,
                intermediate files, and output documents from server storage.
                ConvertingHub does NOT permanently store, archive, or inspect
                your uploaded files.
              </Typography>
            </Box>

            {/* Section 8 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                8. Third-Party Services
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub integrates trusted cloud infrastructure partners
                to deliver services:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
                <li>
                  <Typography variant="body1">
                    <strong>Paddle (Merchant of Record):</strong> Acts as our online reseller and Merchant of Record for payment processing, billing, invoicing, sales tax compliance, and subscription management.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    <strong>Google Cloud / Firebase:</strong> Provides global
                    web hosting, SSL encryption, Google OAuth authentication,
                    and Firestore user database isolation.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    <strong>Render Cloud Infrastructure:</strong> Hosts the
                    backend conversion service for document transformations
                    under strict HTTPS encryption.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    <strong>Adobe PDF Services API:</strong> Utilized
                    server-side for document layout fidelity during PDF to
                    DOCX/PPTX/XLSX transformations.
                  </Typography>
                </li>
              </Box>
            </Box>

            {/* Section 9 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                9. Firebase
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub is hosted on Firebase Hosting and uses Firebase
                Authentication and Cloud Firestore. Firestore security rules
                enforce strict user data isolation (`request.auth.uid ==
                userId`), ensuring users can only read or write their own user
                profile document.
              </Typography>
            </Box>

            {/* Section 10 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                10. Payment Processing, Subscriptions &amp; Billing (Paddle)
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub offers both free core tools and paid subscription plans (e.g. ConvertingHub Pro). All online orders, subscription payments, and billing transactions are processed by our trusted Merchant of Record, <strong>Paddle.com Market Limited (&quot;Paddle&quot;)</strong>.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                When purchasing a subscription, your payment details (credit card information, billing address, tax ID, and transaction history) are handled directly by Paddle in compliance with PCI-DSS Level 1 security standards. ConvertingHub does NOT store credit card numbers or financial details on our servers. Paddle handles recurring charges, tax calculation, invoices, and customer billing support.
              </Typography>
            </Box>

            {/* Section 11 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                11. Data Security
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We implement industry-standard technical security controls to
                safeguard data, including:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
                <li>
                  <Typography variant="body1">
                    Enforced HTTPS/TLS encryption across all web traffic and API
                    endpoints.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Security headers (X-Content-Type-Options: nosniff,
                    X-Frame-Options: SAMEORIGIN, Referrer-Policy).
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Firestore rule enforcement restricting user document access.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Immediate automated deletion of server conversion files
                    post-processing.
                  </Typography>
                </li>
              </Box>
            </Box>

            {/* Section 12 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                12. Data Retention
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                - <strong>Uploaded Files & Conversions:</strong> Deleted
                immediately after processing completion.
                <br />- <strong>User Profile Data (Google Login):</strong>{' '}
                Retained in Cloud Firestore until account deletion request.
                <br />- <strong>Support Communications:</strong> Retained as
                necessary to resolve user inquiries.
                <br />- <strong>Local Storage Preferences:</strong> Managed
                locally in your browser; cleared by clearing browser storage.
              </Typography>
            </Box>

            {/* Section 13 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                13. Data Deletion Rights & Requests
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                You have the right to request deletion of your account and
                personal information at any time. To request data deletion,
                email customer support at:
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                href="mailto:it.expert.usmaan@gmail.com"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                it.expert.usmaan@gmail.com
              </Button>
            </Box>

            {/* Section 14 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                14. Children&apos;s Privacy
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub is not knowingly intended to target or collect
                personal information from children under the age of 13. If you
                believe a child has provided us with personal information,
                contact us for immediate removal.
              </Typography>
            </Box>

            {/* Section 15 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                15. International Users
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub is accessible globally. Information may be
                processed on servers hosted by Google Cloud and Render in
                various geographic regions under compliant cloud data protection
                standards.
              </Typography>
            </Box>

            {/* Section 16 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                16. Your Privacy Rights
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Depending on your location (such as EU/EEA, UK, or California
                residents), you may have rights under GDPR, CCPA, or applicable
                data privacy laws, including the right to access, rectify, port,
                or request deletion of your personal data. Contact us at{' '}
                <MuiLink href="mailto:it.expert.usmaan@gmail.com">
                  it.expert.usmaan@gmail.com
                </MuiLink>{' '}
                to exercise your rights.
              </Typography>
            </Box>

            {/* Section 17 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                17. Third-Party Links
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub may contain links to external third-party
                services. We are not responsible for the privacy practices or
                contents of third-party websites.
              </Typography>
            </Box>

            {/* Section 18 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                18. Changes to This Privacy Policy
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                ConvertingHub may update this Privacy Policy from time to time.
                The effective date at the top of this page will reflect the date
                of material modifications.
              </Typography>
            </Box>

            {/* Section 19 */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                gutterBottom
                color="text.primary"
              >
                19. Contact Us
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                If you have any questions or concerns regarding this Privacy
                Policy or your data privacy rights, please contact us at:
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 3, borderRadius: 3, bgcolor: 'action.hover' }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  ConvertingHub Support & Privacy Team
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email:{' '}
                  <MuiLink href="mailto:it.expert.usmaan@gmail.com">
                    it.expert.usmaan@gmail.com
                  </MuiLink>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Website:{' '}
                  <MuiLink
                    href="https://convertinghub-official.web.app"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://convertinghub-official.web.app
                  </MuiLink>
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
