import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('arc-maps', {
  i18n: {
    name: 'translation:categories.arc-maps.coordinateConverter.name',
    description:
      'translation:categories.arc-maps.coordinateConverter.description',
    shortDescription:
      'translation:categories.arc-maps.coordinateConverter.shortDescription'
  },

  path: 'coordinate-converter',
  icon: 'gis:earth',

  keywords: [
    'arcgis',
    'arcmap',
    'arcgis pro',
    'gis',
    'coordinates',
    'map',
    'spatial',
    'utm',
    'kml',
    'shapefile'
  ],
  component: lazy(() => import('./index'))
});
