import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('arc-maps', {
  i18n: {
    name: 'translation:categories.arc-maps.removeDuplicateVertices.name',
    description:
      'translation:categories.arc-maps.removeDuplicateVertices.description',
    shortDescription:
      'translation:categories.arc-maps.removeDuplicateVertices.shortDescription'
  },
  path: 'remove-duplicate-vertices',
  icon: 'gis:polygon-pt',
  keywords: [
    'arcgis',
    'arcmap',
    'vertices',
    'duplicate',
    'collinear',
    'clean',
    'simplify',
    'polyline',
    'polygon',
    'path',
    'gis'
  ],
  component: lazy(() => import('./index'))
});
