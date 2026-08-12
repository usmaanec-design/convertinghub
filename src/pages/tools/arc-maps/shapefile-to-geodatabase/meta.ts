import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('arc-maps', {
  i18n: {
    name: 'translation:categories.arc-maps.shapefileToGeodatabase.name',
    description: 'translation:categories.arc-maps.shapefileToGeodatabase.description',
    shortDescription: 'translation:categories.arc-maps.shapefileToGeodatabase.shortDescription'
  },
  path: 'shapefile-to-geodatabase',
  icon: 'gis:database',
  keywords: [
    'shapefile',
    'shp',
    'geodatabase',
    'gdb',
    'geopackage',
    'gpkg',
    'arcgis',
    'arcmap',
    'spatial',
    'database',
    'convert'
  ],
  component: lazy(() => import('./index'))
});
