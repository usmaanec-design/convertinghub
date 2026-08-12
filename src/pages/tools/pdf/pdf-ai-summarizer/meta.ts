import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.pdfAiSummarizer.name',
    description: 'translation:pdf.pdfAiSummarizer.description',
    shortDescription: 'translation:pdf.pdfAiSummarizer.shortDescription'
  },
  path: 'pdf-ai-summarizer',
  icon: 'material-symbols:auto-awesome-outline',
  keywords: ['ai', 'summarizer', 'summary', 'extract', 'key points', 'pdf', 'intelligence'],
  component: lazy(() => import('./index'))
});
