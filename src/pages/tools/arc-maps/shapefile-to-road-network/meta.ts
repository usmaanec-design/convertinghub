import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('arc-maps', {
  i18n: {
    name: 'translation:categories.arc-maps.shapefileToRoadNetwork.name',
    description:
      'translation:categories.arc-maps.shapefileToRoadNetwork.description',
    shortDescription:
      'translation:categories.arc-maps.shapefileToRoadNetwork.shortDescription'
  },
  path: 'shapefile-to-road-network',
  icon: 'gis:route',
  keywords: [
    'shapefile',
    'road network',
    'topology',
    'nodes',
    'edges',
    'junctions',
    'network analysis',
    'arcgis',
    'arcmap',
    'gis',
    'convert'
  ],
  component: lazy(() => import('./index'))
});
