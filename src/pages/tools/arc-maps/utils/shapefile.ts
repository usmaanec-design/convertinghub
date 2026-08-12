import JSZip from 'jszip';

export interface SpatialFeature {
  geometryType: 'Point' | 'PolyLine' | 'Polygon';
  coordinates: any; // Point: [x, y], PolyLine: [[x,y]...], Polygon: [[[x,y]...]]
  properties: Record<string, any>;
}

// ==========================================
// 1. ESRI SHAPEFILE GENERATOR (.shp, .shx, .dbf, .prj -> .zip)
// ==========================================

export async function createShapefileZip(
  features: SpatialFeature[],
  layerName: string = 'spatial_layer'
): Promise<Blob> {
  const zip = new JSZip();

  if (features.length === 0) {
    throw new Error('No features available to generate shapefile.');
  }

  const geomType = features[0].geometryType;

  let shapeTypeCode = 1; // Point
  if (geomType === 'PolyLine') shapeTypeCode = 3;
  if (geomType === 'Polygon') shapeTypeCode = 5;

  // Extract all property keys across features
  const propertyKeys: string[] = [];
  const propertyTypes: Record<string, 'C' | 'N'> = {};
  const propertyLengths: Record<string, number> = {};

  features.forEach((f) => {
    Object.entries(f.properties || {}).forEach(([key, val]) => {
      const fieldName = key.substring(0, 10).replace(/[^a-zA-Z0-9_]/g, '');
      if (!fieldName) return;
      if (!propertyKeys.includes(fieldName)) {
        propertyKeys.push(fieldName);
        const isNum = typeof val === 'number';
        propertyTypes[fieldName] = isNum ? 'N' : 'C';
        propertyLengths[fieldName] = isNum ? 18 : Math.max(String(val || '').length, 10);
      } else {
        if (typeof val !== 'number') propertyTypes[fieldName] = 'C';
        propertyLengths[fieldName] = Math.min(
          254,
          Math.max(propertyLengths[fieldName], String(val || '').length)
        );
      }
    });
  });

  // Build .shp & .shx
  const { shpBuffer, shxBuffer } = buildShpAndShxBuffers(features, shapeTypeCode);
  const dbfBuffer = buildDbfBuffer(features, propertyKeys, propertyTypes, propertyLengths);
  const prjContent = `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`;

  zip.file(`${layerName}.shp`, shpBuffer);
  zip.file(`${layerName}.shx`, shxBuffer);
  zip.file(`${layerName}.dbf`, dbfBuffer);
  zip.file(`${layerName}.prj`, prjContent);

  return await zip.generateAsync({ type: 'blob' });
}

function buildShpAndShxBuffers(features: SpatialFeature[], shapeTypeCode: number) {
  // Compute global bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const updateBBox = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  features.forEach((f) => {
    if (f.geometryType === 'Point') {
      updateBBox(f.coordinates[0], f.coordinates[1]);
    } else if (f.geometryType === 'PolyLine') {
      f.coordinates.forEach(([x, y]: [number, number]) => updateBBox(x, y));
    } else if (f.geometryType === 'Polygon') {
      const ring = Array.isArray(f.coordinates[0][0]) ? f.coordinates[0] : f.coordinates;
      ring.forEach(([x, y]: [number, number]) => updateBBox(x, y));
    }
  });

  if (minX === Infinity) {
    minX = minY = -180;
    maxX = maxY = 180;
  }

  // Pre-calculate sizes
  let totalShpBytes = 100;
  let totalShxBytes = 100;

  const recordBuffers: { shpRec: Uint8Array; shxRec: Uint8Array }[] = [];

  features.forEach((f, idx) => {
    const recNum = idx + 1;
    let recBody: Uint8Array;

    if (shapeTypeCode === 1) {
      // Point: ShapeType(4) + X(8) + Y(8) = 20 bytes
      recBody = new Uint8Array(20);
      const view = new DataView(recBody.buffer);
      view.setInt32(0, 1, true);
      view.setFloat64(4, f.coordinates[0] || 0, true);
      view.setFloat64(12, f.coordinates[1] || 0, true);
    } else if (shapeTypeCode === 3 || shapeTypeCode === 5) {
      // PolyLine or Polygon
      const points: [number, number][] =
        shapeTypeCode === 3
          ? f.coordinates
          : Array.isArray(f.coordinates[0][0])
          ? f.coordinates[0]
          : f.coordinates;

      let rMinX = Infinity,
        rMinY = Infinity,
        rMaxX = -Infinity,
        rMaxY = -Infinity;
      points.forEach(([x, y]) => {
        if (x < rMinX) rMinX = x;
        if (y < rMinY) rMinY = y;
        if (x > rMaxX) rMaxX = x;
        if (y > rMaxY) rMaxY = y;
      });

      const numParts = 1;
      const numPoints = points.length;

      // 4 (ShapeType) + 32 (BBox) + 4 (numParts) + 4 (numPoints) + 4*numParts + 16*numPoints
      const bodyLen = 4 + 32 + 4 + 4 + 4 * numParts + 16 * numPoints;
      recBody = new Uint8Array(bodyLen);
      const view = new DataView(recBody.buffer);

      view.setInt32(0, shapeTypeCode, true);
      view.setFloat64(4, rMinX === Infinity ? 0 : rMinX, true);
      view.setFloat64(12, rMinY === Infinity ? 0 : rMinY, true);
      view.setFloat64(20, rMaxX === -Infinity ? 0 : rMaxX, true);
      view.setFloat64(28, rMaxY === -Infinity ? 0 : rMaxY, true);
      view.setInt32(36, numParts, true);
      view.setInt32(40, numPoints, true);
      view.setInt32(44, 0, true); // part 0 offset

      let offset = 48;
      points.forEach(([x, y]) => {
        view.setFloat64(offset, x, true);
        view.setFloat64(offset + 8, y, true);
        offset += 16;
      });
    } else {
      recBody = new Uint8Array(0);
    }

    const contentWords = recBody.length / 2;

    // SHP Record Header (8 bytes) + Body
    const shpRec = new Uint8Array(8 + recBody.length);
    const shpView = new DataView(shpRec.buffer);
    shpView.setInt32(0, recNum, false); // Big Endian record number
    shpView.setInt32(4, contentWords, false); // Big Endian content length in words
    shpRec.set(recBody, 8);

    // SHX Record (8 bytes: offset in words, content length in words)
    const shxRec = new Uint8Array(8);
    const shxView = new DataView(shxRec.buffer);
    const offsetInWords = totalShpBytes / 2;
    shxView.setInt32(0, offsetInWords, false);
    shxView.setInt32(4, contentWords, false);

    recordBuffers.push({ shpRec, shxRec });
    totalShpBytes += shpRec.length;
    totalShxBytes += shxRec.length;
  });

  // Build SHP Buffer
  const shpBuffer = new Uint8Array(totalShpBytes);
  const shpView = new DataView(shpBuffer.buffer);
  shpView.setInt32(0, 9994, false); // File Code
  shpView.setInt32(24, totalShpBytes / 2, false); // File Length
  shpView.setInt32(28, 1000, true); // Version
  shpView.setInt32(32, shapeTypeCode, true);
  shpView.setFloat64(36, minX, true);
  shpView.setFloat64(44, minY, true);
  shpView.setFloat64(52, maxX, true);
  shpView.setFloat64(60, maxY, true);

  let shpOffset = 100;
  recordBuffers.forEach(({ shpRec }) => {
    shpBuffer.set(shpRec, shpOffset);
    shpOffset += shpRec.length;
  });

  // Build SHX Buffer
  const shxBuffer = new Uint8Array(totalShxBytes);
  const shxView = new DataView(shxBuffer.buffer);
  shxView.setInt32(0, 9994, false);
  shxView.setInt32(24, totalShxBytes / 2, false);
  shxView.setInt32(28, 1000, true);
  shxView.setInt32(32, shapeTypeCode, true);
  shxView.setFloat64(36, minX, true);
  shxView.setFloat64(44, minY, true);
  shxView.setFloat64(52, maxX, true);
  shxView.setFloat64(60, maxY, true);

  let shxOffset = 100;
  recordBuffers.forEach(({ shxRec }) => {
    shxBuffer.set(shxRec, shxOffset);
    shxOffset += shxRec.length;
  });

  return { shpBuffer, shxBuffer };
}

function buildDbfBuffer(
  features: SpatialFeature[],
  fields: string[],
  types: Record<string, 'C' | 'N'>,
  lengths: Record<string, number>
): Uint8Array {
  const headerSize = 32 + fields.length * 32 + 1;
  const recordSize = 1 + fields.reduce((sum, f) => sum + (lengths[f] || 10), 0);
  const totalDbfBytes = headerSize + features.length * recordSize;

  const dbfBuffer = new Uint8Array(totalDbfBytes);
  const view = new DataView(dbfBuffer.buffer);

  dbfBuffer[0] = 0x03; // dBase III
  const date = new Date();
  dbfBuffer[1] = date.getFullYear() - 1900;
  dbfBuffer[2] = date.getMonth() + 1;
  dbfBuffer[3] = date.getDate();

  view.setInt32(4, features.length, true);
  view.setInt16(8, headerSize, true);
  view.setInt16(10, recordSize, true);

  // Field descriptors
  let fieldOffset = 32;
  fields.forEach((f) => {
    const nameBytes = new TextEncoder().encode(f.substring(0, 10));
    dbfBuffer.set(nameBytes, fieldOffset);
    dbfBuffer[fieldOffset + 11] = types[f].charCodeAt(0);
    dbfBuffer[fieldOffset + 16] = lengths[f] || 10;
    if (types[f] === 'N') dbfBuffer[fieldOffset + 17] = 4;
    fieldOffset += 32;
  });
  dbfBuffer[fieldOffset] = 0x0d; // Header terminator

  // Records
  let recOffset = headerSize;
  features.forEach((feat) => {
    dbfBuffer[recOffset] = 0x20; // Active record flag (space)
    let curColOffset = recOffset + 1;

    fields.forEach((f) => {
      const len = lengths[f] || 10;
      let valStr = String(feat.properties?.[f] ?? '');
      if (types[f] === 'N') {
        valStr = valStr.substring(0, len).padStart(len, ' ');
      } else {
        valStr = valStr.substring(0, len).padEnd(len, ' ');
      }
      const valBytes = new TextEncoder().encode(valStr);
      dbfBuffer.set(valBytes.subarray(0, len), curColOffset);
      curColOffset += len;
    });

    recOffset += recordSize;
  });

  return dbfBuffer;
}

// ==========================================
// 2. ESRI SHAPEFILE PARSER (.shp + .dbf -> GeoJSON)
// ==========================================

export interface ParsedShapefileResult {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: {
      type: string;
      coordinates: any;
    };
    properties: Record<string, any>;
  }[];
  bbox?: [number, number, number, number];
}

export function parseShapefileBuffers(
  shpBuffer: ArrayBuffer,
  dbfBuffer?: ArrayBuffer
): ParsedShapefileResult {
  const shpView = new DataView(shpBuffer);
  const fileCode = shpView.getInt32(0, false);
  if (fileCode !== 9994) {
    throw new Error('Invalid ESRI Shapefile header (File Code must be 9994).');
  }

  const minX = shpView.getFloat64(36, true);
  const minY = shpView.getFloat64(44, true);
  const maxX = shpView.getFloat64(52, true);
  const maxY = shpView.getFloat64(60, true);

  const parsedProperties = dbfBuffer ? parseDbfBuffer(dbfBuffer) : [];

  const features: any[] = [];
  let offset = 100;
  let recIndex = 0;

  while (offset < shpBuffer.byteLength) {
    if (offset + 8 > shpBuffer.byteLength) break;
    const contentLenWords = shpView.getInt32(offset + 4, false);
    const contentBytes = contentLenWords * 2;
    offset += 8;

    if (contentBytes <= 0 || offset + contentBytes > shpBuffer.byteLength) break;

    const shapeType = shpView.getInt32(offset, true);

    let geometry: any = null;

    if (shapeType === 1) {
      // Point
      const x = shpView.getFloat64(offset + 4, true);
      const y = shpView.getFloat64(offset + 12, true);
      geometry = { type: 'Point', coordinates: [x, y] };
    } else if (shapeType === 3 || shapeType === 5) {
      // PolyLine or Polygon
      const numParts = shpView.getInt32(offset + 36, true);
      const numPoints = shpView.getInt32(offset + 40, true);

      const parts: number[] = [];
      for (let i = 0; i < numParts; i++) {
        parts.push(shpView.getInt32(offset + 44 + i * 4, true));
      }

      const ptsOffset = offset + 44 + numParts * 4;
      const points: [number, number][] = [];
      for (let i = 0; i < numPoints; i++) {
        const px = shpView.getFloat64(ptsOffset + i * 16, true);
        const py = shpView.getFloat64(ptsOffset + i * 16 + 8, true);
        points.push([px, py]);
      }

      if (shapeType === 3) {
        // LineString or MultiLineString
        if (numParts === 1) {
          geometry = { type: 'LineString', coordinates: points };
        } else {
          const multiLine: [number, number][][] = [];
          for (let p = 0; p < numParts; p++) {
            const start = parts[p];
            const end = p < numParts - 1 ? parts[p + 1] : numPoints;
            multiLine.push(points.slice(start, end));
          }
          geometry = { type: 'MultiLineString', coordinates: multiLine };
        }
      } else {
        // Polygon
        const polygonRings: [number, number][][] = [];
        for (let p = 0; p < numParts; p++) {
          const start = parts[p];
          const end = p < numParts - 1 ? parts[p + 1] : numPoints;
          polygonRings.push(points.slice(start, end));
        }
        geometry = { type: 'Polygon', coordinates: polygonRings };
      }
    }

    if (geometry) {
      features.push({
        type: 'Feature',
        geometry,
        properties: parsedProperties[recIndex] || {}
      });
    }

    offset += contentBytes;
    recIndex++;
  }

  return {
    type: 'FeatureCollection',
    features,
    bbox: [minX, minY, maxX, maxY]
  };
}

function parseDbfBuffer(dbfBuffer: ArrayBuffer): Record<string, any>[] {
  const view = new DataView(dbfBuffer);
  const numRecords = view.getInt32(4, true);
  const headerSize = view.getInt16(8, true);
  const recordSize = view.getInt16(10, true);

  const fields: { name: string; type: string; len: number }[] = [];
  let fOffset = 32;

  while (fOffset < headerSize - 1) {
    if (dbfBuffer.byteLength < fOffset + 32) break;
    if (view.getUint8(fOffset) === 0x0d) break;

    const nameBytes = new Uint8Array(dbfBuffer, fOffset, 11);
    let name = new TextDecoder().decode(nameBytes).replace(/\0/g, '').trim();
    const type = String.fromCharCode(view.getUint8(fOffset + 11));
    const len = view.getUint8(fOffset + 16);

    if (name) {
      fields.push({ name, type, len });
    }
    fOffset += 32;
  }

  const results: Record<string, any>[] = [];
  let recOffset = headerSize;

  for (let r = 0; r < numRecords; r++) {
    if (recOffset + recordSize > dbfBuffer.byteLength) break;
    const isDeleted = view.getUint8(recOffset) === 0x2a; // '*'
    if (!isDeleted) {
      const rowProps: Record<string, any> = {};
      let curCol = recOffset + 1;

      fields.forEach((f) => {
        const bytes = new Uint8Array(dbfBuffer, curCol, f.len);
        const strVal = new TextDecoder().decode(bytes).trim();
        if (f.type === 'N' || f.type === 'F') {
          const num = Number(strVal);
          rowProps[f.name] = isNaN(num) ? strVal : num;
        } else {
          rowProps[f.name] = strVal;
        }
        curCol += f.len;
      });
      results.push(rowProps);
    }
    recOffset += recordSize;
  }

  return results;
}
