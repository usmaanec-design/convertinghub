import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.excelToPdf.name',
    description: 'translation:pdf.excelToPdf.description',
    shortDescription: 'translation:pdf.excelToPdf.shortDescription'
  },
  path: 'excel-to-pdf',
  icon: 'vscode-icons:file-type-excel',
  keywords: ['excel', 'xls', 'xlsx', 'csv', 'spreadsheet', 'pdf', 'convert'],
  component: lazy(() => import('./index'))
});
