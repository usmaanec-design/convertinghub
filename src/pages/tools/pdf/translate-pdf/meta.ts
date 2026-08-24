import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.translatePdf.name',
    description: 'translation:pdf.translatePdf.description',
    shortDescription: 'translation:pdf.translatePdf.shortDescription'
  },
  path: 'translate-pdf',
  icon: 'flat-color-icons:globe',
  keywords: [
    'translate',
    'languages',
    'pdf',
    'conversion',
    'ai',
    'multilingual'
  ],
  component: lazy(() => import('./index'))
});
