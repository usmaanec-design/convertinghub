import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.cropPdf.name',
    description: 'translation:pdf.cropPdf.description',
    shortDescription: 'translation:pdf.cropPdf.shortDescription'
  },
  path: 'crop-pdf',
  icon: 'material-symbols:crop',
  keywords: ['crop', 'trim', 'margins', 'pdf', 'bounding box', 'cut'],
  component: lazy(() => import('./index'))
});
