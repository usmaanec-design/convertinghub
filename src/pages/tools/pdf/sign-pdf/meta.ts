import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.signPdf.name',
    description: 'translation:pdf.signPdf.description',
    shortDescription: 'translation:pdf.signPdf.shortDescription'
  },
  path: 'sign-pdf',
  icon: 'flat-color-icons:signature',
  keywords: ['sign', 'signature', 'draw', 'e-sign', 'pdf', 'document'],
  component: lazy(() => import('./index'))
});
