import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SEOHead from 'components/SEOHead';
import { BLOG_POSTS } from 'seo/blogData';
import { getSiteUrl } from 'seo/seoConfig';

export default function BlogIndex() {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/blog`;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <SEOHead
        title="ConvertingHub Blog – Guides, Tutorials & Document Optimization Tips"
        description="Read the latest guides and tutorials on converting PDF files, image compression, document editing, and online productivity tools."
        canonicalUrl={canonicalUrl}
      />

      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          underline="hover"
        >
          Home
        </MuiLink>
        <Typography color="text.primary">Blog</Typography>
      </Breadcrumbs>

      <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
        ConvertingHub Knowledge Center
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 5, maxWidth: '800px' }}
      >
        Helpful guides, tutorials, and insights to help you get the most out of
        your document conversion and productivity tools.
      </Typography>

      <Grid container spacing={4}>
        {BLOG_POSTS.map((post) => (
          <Grid item xs={12} sm={6} md={4} key={post.slug}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  {post.date} • {post.author}
                </Typography>
                <Typography
                  variant="h6"
                  component="h2"
                  fontWeight="bold"
                  gutterBottom
                >
                  {post.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {post.description}
                </Typography>
                <Button
                  component={RouterLink}
                  to={`/blog/${post.slug}`}
                  variant="outlined"
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  Read Guide
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
