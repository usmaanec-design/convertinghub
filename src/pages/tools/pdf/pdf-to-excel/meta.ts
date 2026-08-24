import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.pdfToExcel.name',
    description: 'translation:pdf.pdfToExcel.description',
    shortDescription: 'translation:pdf.pdfToExcel.shortDescription'
  },
  path: 'pdf-to-excel',
  icon: 'vscode-icons:file-type-excel',
  keywords: [
    'pdf',
    'excel',
    'xls',
    'xlsx',
    'csv',
    'spreadsheet',
    'tables',
    'convert'
  ],
  component: lazy(() => import('./index'))
});
