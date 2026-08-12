import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('arc-maps', {
  i18n: {
    name: 'translation:categories.arc-maps.geodatabaseToShapefile.name',
    description: 'translation:categories.arc-maps.geodatabaseToShapefile.description',
    shortDescription: 'translation:categories.arc-maps.geodatabaseToShapefile.shortDescription'
  },
  path: 'geodatabase-to-shapefile',
  icon: 'gis:layer-stack',
  keywords: [
    'geodatabase',
    'gdb',
    'geopackage',
    'gpkg',
    'shapefile',
    'shp',
    'dbf',
    'arcgis',
    'arcmap',
    'spatial',
    'convert'
  ],
  component: lazy(() => import('./index'))
});
