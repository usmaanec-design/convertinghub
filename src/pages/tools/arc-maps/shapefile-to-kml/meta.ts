import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('arc-maps', {
  i18n: {
    name: 'translation:categories.arc-maps.shapefileToKml.name',
    description: 'translation:categories.arc-maps.shapefileToKml.description',
    shortDescription:
      'translation:categories.arc-maps.shapefileToKml.shortDescription'
  },
  path: 'shapefile-to-kml',
  icon: 'gis:shapefile',
  keywords: [
    'shapefile',
    'shp',
    'dbf',
    'kml',
    'kmz',
    'google earth',
    'arcgis',
    'arcmap',
    'convert',
    'gis'
  ],
  component: lazy(() => import('./index'))
});
