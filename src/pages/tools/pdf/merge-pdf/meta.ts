import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const meta = defineTool('pdf', {
  icon: 'flat-color-icons:flow-chart',
  component: lazy(() => import('./index')),
  keywords: ['pages', 'combine', 'document', 'join', 'append'],
  path: 'merge-pdf',
  i18n: {
    name: 'pdf:mergePdf.title',
    description: 'pdf:mergePdf.description',
    shortDescription: 'pdf:mergePdf.shortDescription',
    userTypes: ['generalUsers']
  }
});
