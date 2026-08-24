import React from 'react';
import { Helmet } from 'react-helmet';
import { getSiteUrl } from '../seo/seoConfig';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  keywords?: string[];
  breadcrumbs?: { name: string; item: string }[];
  faqs?: { question: string; answer: string }[];
  schemaType?: 'WebApplication' | 'SoftwareApplication' | 'WebPage' | 'Article';
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  noindex = false,
  keywords,
  breadcrumbs,
  faqs,
  schemaType = 'WebApplication'
}) => {
  const siteUrl = getSiteUrl();
  const defaultImage = `${siteUrl}/Logos/logo-og.png`;
  const imageToUse = ogImage || defaultImage;

  // WebSite schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ConvertingHub',
    url: siteUrl,
    description: 'Free online document, PDF, image, and media conversion tools.'
  };

  // App/Software schema
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: title.split('–')[0].trim(),
    description: description,
    url: canonicalUrl,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD'
    }
  };

  // Breadcrumbs schema
  let breadcrumbSchema = null;
  if (breadcrumbs && breadcrumbs.length > 0) {
    breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: b.name,
        item: b.item
      }))
    };
  }

  // FAQ schema
  let faqSchema = null;
  if (faqs && faqs.length > 0) {
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  return (
    <Helmet>
      {/* Standard HTML Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <link rel="canonical" href={canonicalUrl} />
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow'}
      />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content="ConvertingHub" />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageToUse} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageToUse} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">{JSON.stringify(appSchema)}</script>
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      {faqSchema && (
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
