import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.pdfToPpt.name',
    description: 'translation:pdf.pdfToPpt.description',
    shortDescription: 'translation:pdf.pdfToPpt.shortDescription'
  },
  path: 'pdf-to-ppt',
  icon: 'vscode-icons:file-type-powerpoint',
  keywords: ['pdf', 'ppt', 'pptx', 'powerpoint', 'presentation', 'slides', 'convert'],
  component: lazy(() => import('./index'))
});
