import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Paper,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MapIcon from '@mui/icons-material/Map';
import { createShapefileZip, SpatialFeature } from '../utils/shapefile';

const SAMPLE_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Sample Points</name>
    <Placemark>
      <name>Cairo Tower</name>
      <description>Iconic landmark in Cairo</description>
      <Point>
        <coordinates>31.2298,30.0459,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Giza Pyramids</name>
      <description>Ancient Pyramid Complex</description>
      <Point>
        <coordinates>31.1342,29.9792,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

export default function KmlToShapefileConverter() {
  const [kmlText, setKmlText] = useState<string>(SAMPLE_KML);
  const [layerName, setLayerName] = useState<string>('kml_converted');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Parse KML Placemarks into Spatial Features
  const features: SpatialFeature[] = useMemo(() => {
    if (!kmlText.trim()) return [];
    try {
      setError(null);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlText, 'application/xml');
      const placemarks = xmlDoc.getElementsByTagName('Placemark');
      const parsedFeatures: SpatialFeature[] = [];

      for (let i = 0; i < placemarks.length; i++) {
        const pm = placemarks[i];
        const name = pm.getElementsByTagName('name')[0]?.textContent || `Placemark_${i + 1}`;
        const description = pm.getElementsByTagName('description')[0]?.textContent || '';

        // Extract ExtendedData
        const properties: Record<string, any> = { Name: name, Description: description };
        const dataNodes = pm.getElementsByTagName('Data');
        for (let d = 0; d < dataNodes.length; d++) {
          const key = dataNodes[d].getAttribute('name');
          const val = dataNodes[d].getElementsByTagName('value')[0]?.textContent || '';
          if (key) properties[key] = val;
        }

        // Point
        const pointNode = pm.getElementsByTagName('Point')[0];
        if (pointNode) {
          const coordsStr = pointNode.getElementsByTagName('coordinates')[0]?.textContent || '';
          const parts = coordsStr.trim().split(',').map(Number);
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            parsedFeatures.push({
              geometryType: 'Point',
              coordinates: [parts[0], parts[1]],
              properties
            });
            continue;
          }
        }

        // LineString
        const lineNode = pm.getElementsByTagName('LineString')[0];
        if (lineNode) {
          const coordsStr = lineNode.getElementsByTagName('coordinates')[0]?.textContent || '';
          const linePts = coordsStr
            .trim()
            .split(/\s+/)
            .map((c) => c.split(',').map(Number))
            .filter((p) => p.length >= 2 && !isNaN(p[0]) && !isNaN(p[1]))
            .map((p) => [p[0], p[1]]);

          if (linePts.length > 0) {
            parsedFeatures.push({
              geometryType: 'PolyLine',
              coordinates: linePts,
              properties
            });
            continue;
          }
        }

        // Polygon
        const polyNode = pm.getElementsByTagName('Polygon')[0];
        if (polyNode) {
          const coordsStr = polyNode.getElementsByTagName('coordinates')[0]?.textContent || '';
          const polyPts = coordsStr
            .trim()
            .split(/\s+/)
            .map((c) => c.split(',').map(Number))
            .filter((p) => p.length >= 2 && !isNaN(p[0]) && !isNaN(p[1]))
            .map((p) => [p[0], p[1]]);

          if (polyPts.length > 0) {
            parsedFeatures.push({
              geometryType: 'Polygon',
              coordinates: polyPts,
              properties
            });
          }
        }
      }

      return parsedFeatures;
    } catch (e: any) {
      setError(`Failed to parse KML: ${e.message}`);
      return [];
    }
  }, [kmlText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setKmlText(text);
      setLayerName(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsText(file);
  };

  const handleDownloadShapefile = async () => {
    if (features.length === 0) return;
    try {
      setIsProcessing(true);
      const blob = await createShapefileZip(features, layerName || 'kml_converted');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${layerName || 'kml_converted'}_shapefile.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Error creating Shapefile ZIP: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: features.map((f) => ({
        type: 'Feature',
        geometry: {
          type: f.geometryType === 'PolyLine' ? 'LineString' : f.geometryType,
          coordinates: f.coordinates
        },
        properties: f.properties
      }))
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerName || 'kml_converted'}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto', mt: 2 }}>
      <Stack spacing={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <MapIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            KML to ESRI Shapefile Converter
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Convert Google Earth KML files into ESRI Shapefile (.shp, .shx, .dbf, .prj) vector formats for ArcGIS 10.8 & ArcGIS Pro.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
            >
              Upload KML File
              <input type="file" accept=".kml,.xml" hidden onChange={handleFileUpload} />
            </Button>

            <Typography variant="subtitle2">Or Paste KML Document XML:</Typography>
            <TextField
              multiline
              rows={12}
              fullWidth
              value={kmlText}
              onChange={(e) => setKmlText(e.target.value)}
              sx={{ fontFamily: 'monospace', fontSize: 12 }}
            />

            <TextField
              label="Output Shapefile Layer Name"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              fullWidth
            />
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" gutterBottom>
              Layer Summary & Attribute Preview
            </Typography>

            <Stack direction="row" spacing={1} my={1}>
              <Chip label={`Placemarks Found: ${features.length}`} color="primary" />
              {features.length > 0 && (
                <Chip label={`Geometry: ${features[0].geometryType}`} color="secondary" />
              )}
            </Stack>

            <TableContainer sx={{ maxHeight: 250, border: '1px solid', borderColor: 'divider', my: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Coordinates</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {features.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{f.properties.Name}</TableCell>
                      <TableCell>{f.properties.Description || '-'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {JSON.stringify(f.coordinates).substring(0, 30)}...
                      </TableCell>
                    </TableRow>
                  ))}
                  {features.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No KML Placemarks parsed.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box mt="auto">
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  fullWidth
                  onClick={handleDownloadShapefile}
                  disabled={features.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Generating Zip...' : 'Download Shapefile (.zip)'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<DownloadIcon />}
                  fullWidth
                  onClick={handleDownloadGeoJSON}
                  disabled={features.length === 0}
                >
                  Download GeoJSON (.geojson)
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}
