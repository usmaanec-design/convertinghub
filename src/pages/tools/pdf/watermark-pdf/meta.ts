import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.watermarkPdf.name',
    description: 'translation:pdf.watermarkPdf.description',
    shortDescription: 'translation:pdf.watermarkPdf.shortDescription'
  },
  path: 'watermark-pdf',
  icon: 'material-symbols:water-drop-outline',
  keywords: ['watermark', 'stamp', 'pdf', 'text', 'overlay', 'protect'],
  component: lazy(() => import('./index'))
});
