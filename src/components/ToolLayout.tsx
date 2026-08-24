import { Box } from '@mui/material';
import React, { ReactNode } from 'react';
import ToolHeader from './ToolHeader';
import { getToolsByCategory } from '@tools/index';
import {
  capitalizeFirstLetter,
  getI18nNamespaceFromToolCategory
} from '../utils/string';
import { IconifyIcon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { ToolCategory } from '@tools/defineTool';
import { FullI18nKey } from '../i18n';
import SEOHead from './SEOHead';
import ToolSeoContent from './ToolSeoContent';
import { getToolSeoData } from '../seo/seoConfig';

export default function ToolLayout({
  children,
  icon,
  i18n,
  type,
  fullPath
}: {
  icon?: IconifyIcon | string;
  type: ToolCategory;
  fullPath: string;
  children: ReactNode;
  i18n?: {
    name: FullI18nKey;
    description: FullI18nKey;
    shortDescription: FullI18nKey;
  };
}) {
  const { t } = useTranslation([
    'translation',
    getI18nNamespaceFromToolCategory(type)
  ]);

  //@ts-ignore
  const rawTitle: string = i18n?.name ? t(i18n.name) : 'Tool';
  //@ts-ignore
  const rawDescription: string = i18n?.description ? t(i18n.description) : '';

  const seoData = getToolSeoData(fullPath, rawTitle, rawDescription, type);

  const categoryConfig = getToolsByCategory([], t).find(
    (category) => category.type === type
  );

  const categoryTitle = categoryConfig?.rawTitle || capitalizeFirstLetter(type);

  const otherCategoryTools =
    categoryConfig?.tools
      .filter((tool) => t(tool.name) !== rawTitle)
      .map((tool) => ({
        title: t(tool.name),
        description: t(tool.shortDescription),
        link: '/' + tool.path,
        icon: tool.icon
      })) ?? [];

  const breadcrumbs = [
    {
      name: 'Home',
      item:
        seoData.canonicalUrl.split('/')[0] +
        '//' +
        seoData.canonicalUrl.split('/')[2]
    },
    {
      name: categoryTitle,
      item: `${seoData.canonicalUrl.split('/')[0]}//${
        seoData.canonicalUrl.split('/')[2]
      }/categories/${type}`
    },
    { name: rawTitle, item: seoData.canonicalUrl }
  ];

  return (
    <Box
      width={'100%'}
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      sx={{ backgroundColor: 'background.default' }}
    >
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        canonicalUrl={seoData.canonicalUrl}
        keywords={seoData.keywords}
        breadcrumbs={breadcrumbs}
        faqs={seoData.faqs}
      />
      <Box width={{ xs: '95%', md: '92%', lg: '90%' }}>
        <ToolHeader
          title={rawTitle}
          description={rawDescription}
          icon={icon}
          type={type}
          path={fullPath}
        />
        {children}

        {/* Crawlable SEO Content Section */}
        <ToolSeoContent
          categoryName={type}
          categoryTitle={categoryTitle}
          toolName={rawTitle}
          toolPath={fullPath}
          h1={seoData.h1}
          intro={seoData.intro}
          howTo={seoData.howTo}
          features={seoData.features}
          faqs={seoData.faqs}
          relatedTools={otherCategoryTools}
        />
      </Box>
    </Box>
  );
}
