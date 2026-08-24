import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link as MuiLink,
  Divider,
  Stack
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl =
    i18n.language === 'ar' ||
    i18n.language === 'ur' ||
    i18n.language?.startsWith('ur');

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 6,
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ width: '100%', dir: isRtl ? 'rtl' : 'ltr' }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: '2fr 1fr 1fr 1fr'
            },
            gap: { xs: 4, sm: 3, md: 4 },
            width: '100%',
            alignItems: 'start'
          }}
        >
          {/* Brand Column */}
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              textAlign: isRtl ? 'right' : 'left'
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent={isRtl ? 'flex-end' : 'flex-start'}
              sx={{ mb: 1.5 }}
            >
              <img
                src="/Logos/OmniTools-Logo-High-Resolution.png"
                alt="ConvertingHub"
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
              <Typography
                variant="h6"
                fontWeight={800}
                color="primary.main"
                sx={{ letterSpacing: '-0.5px' }}
              >
                ConvertingHub
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.6,
                maxWidth: 340,
                width: '100%',
                display: 'block'
              }}
            >
              Fast, free, and secure online document conversion, PDF processing,
              image editing, and productivity tools.
            </Typography>
          </Box>

          {/* Navigation Column */}
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              textAlign: isRtl ? 'right' : 'left'
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="text.primary"
              sx={{ mb: 1.5 }}
            >
              Navigation
            </Typography>
            <Stack
              spacing={1}
              alignItems={isRtl ? 'flex-end' : 'flex-start'}
              sx={{ width: '100%' }}
            >
              <MuiLink
                component={RouterLink}
                to="/"
                color="text.secondary"
                underline="hover"
                variant="body2"
              >
                {t('navbar.home', 'Home')}
              </MuiLink>
              <MuiLink
                component={RouterLink}
                to="/pricing"
                color="text.secondary"
                underline="hover"
                variant="body2"
              >
                Pricing &amp; Plans
              </MuiLink>
              <MuiLink
                component={RouterLink}
                to="/blog"
                color="text.secondary"
                underline="hover"
                variant="body2"
              >
                Blog &amp; Guides
              </MuiLink>
            </Stack>
          </Box>

          {/* Popular Categories Column */}
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              textAlign: isRtl ? 'right' : 'left'
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="text.primary"
              sx={{ mb: 1.5 }}
            >
              Popular Categories
            </Typography>
            <Stack
              spacing={1}
              alignItems={isRtl ? 'flex-end' : 'flex-start'}
              sx={{ width: '100%' }}
            >
              <MuiLink
                component={RouterLink}
                to="/categories/pdf"
                color="text.secondary"
                underline="hover"
                variant="body2"
              >
                PDF Tools
              </MuiLink>
              <MuiLink
                component={RouterLink}
                to="/categories/audio"
                color="text.secondary"
                underline="hover"
                variant="body2"
              >
                Audio Tools
              </MuiLink>
              <MuiLink
                component={RouterLink}
                to="/categories/image-generic"
                color="text.secondary"
                underline="hover"
                variant="body2"
              >
                Image Tools
              </MuiLink>
            </Stack>
          </Box>

          {/* Legal & Support Column */}
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              textAlign: isRtl ? 'right' : 'left'
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="text.primary"
              sx={{ mb: 1.5 }}
            >
              Legal &amp; Policies
            </Typography>
            <Stack
              spacing={1}
              alignItems={isRtl ? 'flex-end' : 'flex-start'}
              sx={{ width: '100%' }}
            >
              <MuiLink
                component={RouterLink}
                to="/pricing"
                color="text.secondary"
                underline="hover"
                variant="body2"
                fontWeight={600}
              >
                Pricing
              </MuiLink>
              <MuiLink
                component={RouterLink}
                to="/terms-of-service"
                color="text.secondary"
                underline="hover"
                variant="body2"
                fontWeight={600}
              >
                Terms of Service
              </MuiLink>
              <MuiLink
                component={RouterLink}
                to="/privacy-policy"
                color="text.secondary"
                underline="hover"
                variant="body2"
                fontWeight={600}
              >
                Privacy Policy
              </MuiLink>
              <MuiLink
                component={RouterLink}
                to="/refund-policy"
                color="text.secondary"
                underline="hover"
                variant="body2"
                fontWeight={600}
              >
                Refund Policy
              </MuiLink>
              <MuiLink
                href="mailto:it.expert.usmaan@gmail.com"
                color="text.secondary"
                underline="hover"
                variant="body2"
                sx={{ wordBreak: 'break-all' }}
              >
                it.expert.usmaan@gmail.com
              </MuiLink>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ width: '100%' }}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} ConvertingHub. All rights reserved.
          </Typography>
          <MuiLink
            component={RouterLink}
            to="/privacy-policy"
            color="text.secondary"
            underline="hover"
            variant="caption"
          >
            ConvertingHub Privacy Policy
          </MuiLink>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
