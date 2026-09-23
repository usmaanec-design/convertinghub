import { describe, it, expect } from 'vitest';
import {
  normalizeCanonicalUrl,
  getToolSeoData,
  getCategorySeoData,
  getHomeSeoData,
  DEFAULT_SITE_URL
} from './seoConfig';

describe('Canonical URL SEO Implementation', () => {
  describe('normalizeCanonicalUrl', () => {
    it('returns homepage canonical URL with trailing slash', () => {
      expect(normalizeCanonicalUrl('/')).toBe('https://convertinghub-official.web.app/');
      expect(normalizeCanonicalUrl('')).toBe('https://convertinghub-official.web.app/');
      expect(normalizeCanonicalUrl(undefined)).toBe('https://convertinghub-official.web.app/');
      expect(normalizeCanonicalUrl('https://convertinghub-official.web.app')).toBe(
        'https://convertinghub-official.web.app/'
      );
      expect(normalizeCanonicalUrl('https://convertinghub-official.web.app/')).toBe(
        'https://convertinghub-official.web.app/'
      );
    });

    it('returns subpage canonical URLs without trailing slash', () => {
      expect(normalizeCanonicalUrl('/pricing')).toBe('https://convertinghub-official.web.app/pricing');
      expect(normalizeCanonicalUrl('/pricing/')).toBe('https://convertinghub-official.web.app/pricing');
      expect(normalizeCanonicalUrl('pricing')).toBe('https://convertinghub-official.web.app/pricing');
      expect(normalizeCanonicalUrl('/blog')).toBe('https://convertinghub-official.web.app/blog');
      expect(normalizeCanonicalUrl('/blog/')).toBe('https://convertinghub-official.web.app/blog');
      expect(normalizeCanonicalUrl('/blog/how-to-compress-pdf-files')).toBe(
        'https://convertinghub-official.web.app/blog/how-to-compress-pdf-files'
      );
      expect(normalizeCanonicalUrl('/blog/how-to-compress-pdf-files/')).toBe(
        'https://convertinghub-official.web.app/blog/how-to-compress-pdf-files'
      );
    });

    it('enforces exact domain and HTTPS even if full URL or another domain is given', () => {
      expect(normalizeCanonicalUrl('http://convertinghub-official.web.app/pricing')).toBe(
        'https://convertinghub-official.web.app/pricing'
      );
      expect(normalizeCanonicalUrl('https://convertinghub-official.web.app/categories/pdf')).toBe(
        'https://convertinghub-official.web.app/categories/pdf'
      );
      expect(normalizeCanonicalUrl('https://convertinghub-official.web.app/categories/pdf/')).toBe(
        'https://convertinghub-official.web.app/categories/pdf'
      );
    });

    it('strips query parameters and hashes from canonical URLs', () => {
      expect(normalizeCanonicalUrl('/pricing?plan=pro&ref=google')).toBe(
        'https://convertinghub-official.web.app/pricing'
      );
      expect(normalizeCanonicalUrl('/pdf/pdf-to-word#faq-section')).toBe(
        'https://convertinghub-official.web.app/pdf/pdf-to-word'
      );
      expect(normalizeCanonicalUrl('/?source=pwa')).toBe(
        'https://convertinghub-official.web.app/'
      );
    });

    it('correctly handles tool paths with category prefixes', () => {
      expect(normalizeCanonicalUrl('pdf/pdf-to-word')).toBe(
        'https://convertinghub-official.web.app/pdf/pdf-to-word'
      );
      expect(normalizeCanonicalUrl('/pdf/pdf-to-word/')).toBe(
        'https://convertinghub-official.web.app/pdf/pdf-to-word'
      );
      expect(normalizeCanonicalUrl('/converters/audio-converter')).toBe(
        'https://convertinghub-official.web.app/converters/audio-converter'
      );
    });
  });

  describe('getToolSeoData', () => {
    it('generates canonical URL without trailing slash', () => {
      const data = getToolSeoData('pdf/pdf-to-word', 'PDF to Word', 'Convert PDF to Word', 'pdf');
      expect(data.canonicalUrl).toBe('https://convertinghub-official.web.app/pdf/pdf-to-word');
      expect(data.canonicalUrl.startsWith('https://')).toBe(true);
      expect(data.canonicalUrl.endsWith('/')).toBe(false);
    });
  });

  describe('getCategorySeoData', () => {
    it('generates canonical URL for category without trailing slash', () => {
      const data = getCategorySeoData('pdf', 'PDF Tools', 'All PDF tools');
      expect(data.canonicalUrl).toBe('https://convertinghub-official.web.app/categories/pdf');
      expect(data.canonicalUrl.startsWith('https://')).toBe(true);
      expect(data.canonicalUrl.endsWith('/')).toBe(false);
    });
  });

  describe('getHomeSeoData', () => {
    it('generates homepage canonical URL with trailing slash', () => {
      const data = getHomeSeoData();
      expect(data.canonicalUrl).toBe('https://convertinghub-official.web.app/');
      expect(data.canonicalUrl.startsWith('https://')).toBe(true);
      expect(data.canonicalUrl.endsWith('/')).toBe(true);
    });
  });
});
