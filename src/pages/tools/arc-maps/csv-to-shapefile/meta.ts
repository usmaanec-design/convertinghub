import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('arc-maps', {
  i18n: {
    name: 'translation:categories.arc-maps.csvToShapefile.name',
    description: 'translation:categories.arc-maps.csvToShapefile.description',
    shortDescription: 'translation:categories.arc-maps.csvToShapefile.shortDescription'
  },
  path: 'csv-to-shapefile',
  icon: 'gis:poi',
  keywords: [
    'csv',
    'latitude',
    'longitude',
    'lat',
    'lon',
    'shapefile',
    'shp',
    'dbf',
    'arcgis',
    'arcmap',
    'gis',
    'points',
    'convert'
  ],
  component: lazy(() => import('./index'))
});
