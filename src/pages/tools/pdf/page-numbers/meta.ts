import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.pageNumbers.name',
    description: 'translation:pdf.pageNumbers.description',
    shortDescription: 'translation:pdf.pageNumbers.shortDescription'
  },
  path: 'page-numbers',
  icon: 'material-symbols:format-list-numbered',
  keywords: ['page numbers', 'pdf', 'numbering', 'footer', 'header', 'pages'],
  component: lazy(() => import('./index'))
});
