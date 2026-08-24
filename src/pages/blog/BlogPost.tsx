import React from 'react';
import { useParams, Navigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Button,
  Divider
} from '@mui/material';
import SEOHead from 'components/SEOHead';
import { getBlogPost } from 'seo/blogData';
import { getSiteUrl } from 'seo/seoConfig';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

  const breadcrumbs = [
    { name: 'Home', item: `${siteUrl}/` },
    { name: 'Blog', item: `${siteUrl}/blog` },
    { name: post.title, item: canonicalUrl }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <SEOHead
        title={`${post.title} | ConvertingHub Blog`}
        description={post.description}
        canonicalUrl={canonicalUrl}
        keywords={post.keywords}
        breadcrumbs={breadcrumbs}
        schemaType="Article"
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
        <MuiLink
          component={RouterLink}
          to="/blog"
          color="inherit"
          underline="hover"
        >
          Blog
        </MuiLink>
        <Typography color="text.primary" noWrap sx={{ maxWidth: 300 }}>
          {post.title}
        </Typography>
      </Breadcrumbs>

      <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
        {post.title}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 4 }}>
        Published on {post.date} by {post.author}
      </Typography>

      <Divider sx={{ mb: 4 }} />

      <Box
        sx={{
          fontSize: '1.1rem',
          lineHeight: 1.8,
          color: 'text.primary',
          '& h3': { mt: 4, mb: 2, fontWeight: 'bold', fontSize: '1.5rem' },
          '& p': { mb: 2.5 },
          '& ul, & ol': { pl: 3, mb: 2.5 }
        }}
        dangerouslySetInnerHTML={{
          __html: post.content
            .replace(/\n\n/g, '<br/><br/>')
            .replace(/### (.*)/g, '<h3>$1</h3>')
        }}
      />

      {post.toolLink && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mt: 6,
            borderRadius: 3,
            backgroundColor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Try {post.toolName || 'Tool'} Now
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fast, secure, and free online file conversion tool.
          </Typography>
          <Button
            component={RouterLink}
            to={post.toolLink}
            variant="contained"
            color="primary"
            size="large"
            sx={{ borderRadius: 2 }}
          >
            Open {post.toolName || 'Tool'}
          </Button>
        </Paper>
      )}
    </Container>
  );
}
