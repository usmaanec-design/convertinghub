import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('arc-maps', {
  i18n: {
    name: 'translation:categories.arc-maps.kmlToShapefile.name',
    description: 'translation:categories.arc-maps.kmlToShapefile.description',
    shortDescription: 'translation:categories.arc-maps.kmlToShapefile.shortDescription'
  },
  path: 'kml-to-shapefile',
  icon: 'gis:kml',
  keywords: [
    'kml',
    'kmz',
    'google earth',
    'shapefile',
    'shp',
    'dbf',
    'gis',
    'arcgis',
    'arcmap',
    'vector',
    'convert'
  ],
  component: lazy(() => import('./index'))
});
