import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link as MuiLink,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BuildIcon from '@mui/icons-material/Build';
import { Link as RouterLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { getSiteUrl } from '../seo/seoConfig';

export interface ToolSeoContentProps {
  categoryName: string;
  categoryTitle: string;
  toolName: string;
  toolPath: string;
  h1: string;
  intro: string;
  howTo: { step: number; title: string; text: string }[];
  features: { title: string; text: string }[];
  faqs: { question: string; answer: string }[];
  relatedTools: {
    title: string;
    description: string;
    link: string;
    icon?: any;
  }[];
}

export const ToolSeoContent: React.FC<ToolSeoContentProps> = ({
  categoryName,
  categoryTitle,
  toolName,
  h1,
  intro,
  howTo,
  features,
  faqs,
  relatedTools
}) => {
  const siteUrl = getSiteUrl();

  return (
    <Box sx={{ mt: 6, mb: 8, width: '100%' }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <MuiLink
            component={RouterLink}
            to="/"
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}
          >
            Home
          </MuiLink>
          <MuiLink
            component={RouterLink}
            to={`/categories/${categoryName}`}
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}
          >
            {categoryTitle || categoryName}
          </MuiLink>
          <Typography
            color="text.primary"
            sx={{ fontSize: '0.9rem', fontWeight: 600 }}
          >
            {toolName}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Crawlable H1 & Intro */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          gutterBottom
          sx={{ color: 'text.primary', fontSize: '2.25rem' }}
        >
          {h1}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: '1.1rem', lineHeight: 1.7, maxWidth: '900px' }}
        >
          {intro}
        </Typography>
      </Box>

      {/* How to Use Section (Desktop Only) */}
      {howTo && howTo.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            display: { xs: 'none', md: 'block' },
            p: 3,
            mb: 5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <BuildIcon color="primary" />
            How to Use {toolName}
          </Typography>
          <Grid container spacing={3}>
            {howTo.map((item) => (
              <Grid item xs={12} md={4} key={item.step}>
                <Box
                  sx={{
                    p: 2.5,
                    height: '100%',
                    borderRadius: 2,
                    backgroundColor: 'action.hover',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Chip
                    label={`Step ${item.step}`}
                    color="primary"
                    size="small"
                    sx={{ width: 'fit-content', mb: 1.5, fontWeight: 'bold' }}
                  />
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.text}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Features Section (Desktop Only) */}
      {features && features.length > 0 && (
        <Box sx={{ display: { xs: 'none', md: 'block' }, mb: 5 }}>
          <Typography
            variant="h5"
            component="h2"
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 3 }}
          >
            {toolName} Key Features
          </Typography>
          <Grid container spacing={2}>
            {features.map((feat, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    height: '100%',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
                  >
                    <CheckCircleOutlineIcon color="success" sx={{ mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="600">
                        {feat.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {feat.text}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* FAQs Section */}
      {faqs && faqs.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h5"
            component="h2"
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
          >
            <HelpOutlineIcon color="primary" />
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              elevation={0}
              sx={{
                mb: 1.5,
                borderRadius: '8px !important',
                border: '1px solid',
                borderColor: 'divider',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6, fontSize: { xs: '0.85rem', md: '0.9rem' } }}
                >
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Related Tools Internal Linking (Desktop Only) */}
      {relatedTools && relatedTools.length > 0 && (
        <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 6 }}>
          <Typography
            variant="h5"
            component="h2"
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 3 }}
          >
            Related Tools
          </Typography>
          <Grid container spacing={2}>
            {relatedTools.slice(0, 6).map((tool, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Paper
                  component={RouterLink}
                  to={tool.link}
                  elevation={0}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    textDecoration: 'none',
                    color: 'text.primary',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }
                  }}
                >
                  {tool.icon && (
                    <Icon icon={tool.icon} width={28} height={28} />
                  )}
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="subtitle2" fontWeight="600" noWrap>
                      {tool.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      display="block"
                    >
                      {tool.description || 'Free online converter tool'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ToolSeoContent;
