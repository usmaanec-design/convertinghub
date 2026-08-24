import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('arc-maps', {
  i18n: {
    name: 'translation:categories.arc-maps.shapefileToGeojson.name',
    description:
      'translation:categories.arc-maps.shapefileToGeojson.description',
    shortDescription:
      'translation:categories.arc-maps.shapefileToGeojson.shortDescription'
  },
  path: 'shapefile-to-geojson',
  icon: 'gis:geojson',
  keywords: [
    'shapefile',
    'shp',
    'dbf',
    'geojson',
    'arcgis',
    'arcmap',
    'gis',
    'spatial',
    'vector',
    'convert'
  ],
  component: lazy(() => import('./index'))
});
