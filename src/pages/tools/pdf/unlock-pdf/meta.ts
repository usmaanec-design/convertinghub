import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('pdf', {
  i18n: {
    name: 'translation:pdf.unlockPdf.name',
    description: 'translation:pdf.unlockPdf.description',
    shortDescription: 'translation:pdf.unlockPdf.shortDescription'
  },
  path: 'unlock-pdf',
  icon: 'material-symbols:lock-open-outline',
  keywords: ['unlock', 'password', 'decrypt', 'permissions', 'pdf', 'security'],
  component: lazy(() => import('./index'))
});
