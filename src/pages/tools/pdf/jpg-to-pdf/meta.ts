import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.jpgToPdf.name',
    description: 'translation:pdf.jpgToPdf.description',
    shortDescription: 'translation:pdf.jpgToPdf.shortDescription'
  },
  path: 'jpg-to-pdf',
  icon: 'vscode-icons:file-type-image',
  keywords: ['jpg', 'png', 'image', 'jpeg', 'pdf', 'convert'],
  component: lazy(() => import('./index'))
});
