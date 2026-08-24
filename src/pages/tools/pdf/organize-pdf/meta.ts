import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.organizePdf.name',
    description: 'translation:pdf.organizePdf.description',
    shortDescription: 'translation:pdf.organizePdf.shortDescription'
  },
  path: 'organize-pdf',
  icon: 'flat-color-icons:grid',
  keywords: ['organize', 'reorder', 'delete', 'sort', 'pages', 'pdf'],
  component: lazy(() => import('./index'))
});
