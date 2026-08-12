import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.pptToPdf.name',
    description: 'translation:pdf.pptToPdf.description',
    shortDescription: 'translation:pdf.pptToPdf.shortDescription'
  },
  path: 'ppt-to-pdf',
  icon: 'vscode-icons:file-type-powerpoint',
  keywords: ['powerpoint', 'ppt', 'pptx', 'presentation', 'pdf', 'convert'],
  component: lazy(() => import('./index'))
});
