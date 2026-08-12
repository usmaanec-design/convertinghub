import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.pdfToWord.name',
    description: 'translation:pdf.pdfToWord.description',
    shortDescription: 'translation:pdf.pdfToWord.shortDescription'
  },
  path: 'pdf-to-word',
  icon: 'vscode-icons:file-type-word',
  keywords: ['pdf', 'word', 'doc', 'docx', 'convert', 'document', 'edit', 'text'],
  component: lazy(() => import('./index'))
});
