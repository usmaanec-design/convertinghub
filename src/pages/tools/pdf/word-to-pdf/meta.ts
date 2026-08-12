import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.wordToPdf.name',
    description: 'translation:pdf.wordToPdf.description',
    shortDescription: 'translation:pdf.wordToPdf.shortDescription'
  },
  path: 'word-to-pdf',
  icon: 'vscode-icons:file-type-word',
  keywords: ['word', 'doc', 'docx', 'pdf', 'convert'],
  component: lazy(() => import('./index'))
});
