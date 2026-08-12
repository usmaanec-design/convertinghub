import { tool as arcMapsCoordinateConverter } from './coordinate-converter/meta';
import { tool as removeDuplicateVertices } from './remove-duplicate-vertices/meta';
import { tool as kmlToShapefile } from './kml-to-shapefile/meta';
import { tool as shapefileToKml } from './shapefile-to-kml/meta';
import { tool as shapefileToGeojson } from './shapefile-to-geojson/meta';
import { tool as csvToShapefile } from './csv-to-shapefile/meta';
import { tool as shapefileToGeodatabase } from './shapefile-to-geodatabase/meta';
import { tool as geodatabaseToShapefile } from './geodatabase-to-shapefile/meta';
import { tool as shapefileToRoadNetwork } from './shapefile-to-road-network/meta';

export const arcMapsTools = [
  arcMapsCoordinateConverter,
  removeDuplicateVertices,
  kmlToShapefile,
  shapefileToKml,
  shapefileToGeojson,
  csvToShapefile,
  shapefileToGeodatabase,
  geodatabaseToShapefile,
  shapefileToRoadNetwork
];


