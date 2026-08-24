import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SEOHead from 'components/SEOHead';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function NotFoundPage() {
  return (
    <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
      <SEOHead
        title="404 - Page Not Found | ConvertingHub"
        description="The page you are looking for does not exist or has been moved."
        canonicalUrl="https://convertinghub-official.web.app/404"
        noindex={true}
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography
          variant="h2"
          component="h1"
          fontWeight={800}
          gutterBottom
          color="primary.main"
        >
          404
        </Typography>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Page Not Found
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 500, mb: 4 }}
        >
          The page or tool you are looking for does not exist, has been moved,
          or the link may be broken.
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          size="large"
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontWeight: 700,
            textTransform: 'none'
          }}
        >
          Back to Home
        </Button>
      </Paper>
    </Container>
  );
}
