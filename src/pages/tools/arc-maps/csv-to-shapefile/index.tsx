import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Paper,
  Grid,
  Chip,
  MenuItem,
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
import PinDropIcon from '@mui/icons-material/PinDrop';
import { createShapefileZip, SpatialFeature } from '../utils/shapefile';

const SAMPLE_CSV = `Name,Category,Latitude,Longitude
Pyramid of Khufu,Monument,29.9792,31.1342
Luxor Temple,Historical,25.6997,32.6392
Karnak Temple,Historical,25.7188,32.6573
Abu Simbel,Monument,22.3372,31.6258`;

export default function CsvToShapefileConverter() {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV);
  const [latCol, setLatCol] = useState<string>('');
  const [lonCol, setLonCol] = useState<string>('');
  const [layerName, setLayerName] = useState<string>('csv_points');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Parse CSV headers & rows
  const { headers, rows } = useMemo(() => {
    if (!csvText.trim()) return { headers: [], rows: [] };

    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };

    const delimiter = csvText.includes('\t') ? '\t' : csvText.includes(';') ? ';' : ',';
    const hdrs = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const parsedRows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = lines[i].split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const rowObj: Record<string, string> = {};
      hdrs.forEach((h, idx) => {
        rowObj[h] = vals[idx] || '';
      });
      parsedRows.push(rowObj);
    }

    return { headers: hdrs, rows: parsedRows };
  }, [csvText]);

  // Auto-detect Lat / Lon columns
  useEffect(() => {
    if (headers.length > 0) {
      const lower = headers.map((h) => h.toLowerCase());
      const latIdx = lower.findIndex((h) =>
        ['lat', 'latitude', 'y', 'lat_dd', 'north'].includes(h)
      );
      const lonIdx = lower.findIndex((h) =>
        ['lon', 'lng', 'longitude', 'x', 'lon_dd', 'east'].includes(h)
      );

      if (latIdx !== -1 && !latCol) setLatCol(headers[latIdx]);
      if (lonIdx !== -1 && !lonCol) setLonCol(headers[lonIdx]);
    }
  }, [headers]);

  // Generate Spatial Features from CSV rows
  const features: SpatialFeature[] = useMemo(() => {
    if (!latCol || !lonCol || rows.length === 0) return [];
    const pts: SpatialFeature[] = [];

    rows.forEach((row) => {
      const lat = parseFloat(row[latCol]);
      const lon = parseFloat(row[lonCol]);

      if (!isNaN(lat) && !isNaN(lon)) {
        const props: Record<string, any> = {};
        Object.entries(row).forEach(([k, v]) => {
          if (k !== latCol && k !== lonCol) {
            const num = Number(v);
            props[k] = isNaN(num) ? v : num;
          }
        });

        pts.push({
          geometryType: 'Point',
          coordinates: [lon, lat], // ESRI X = Lon, Y = Lat
          properties: props
        });
      }
    });

    return pts;
  }, [rows, latCol, lonCol]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
      setLayerName(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsText(file);
  };

  const handleDownloadShapefile = async () => {
    if (features.length === 0) return;
    try {
      setIsProcessing(true);
      setError(null);
      const blob = await createShapefileZip(features, layerName || 'csv_points');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${layerName || 'csv_points'}_shapefile.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Error generating Shapefile ZIP: ${err.message}`);
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
          type: 'Point',
          coordinates: f.coordinates
        },
        properties: f.properties
      }))
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerName || 'csv_points'}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto', mt: 2 }}>
      <Stack spacing={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <PinDropIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            CSV (Lat/Lon) to ESRI Shapefile Converter
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Convert CSV coordinate tables into spatial point ESRI Shapefiles (.shp, .shx, .dbf, .prj) for ArcGIS 10.8 & ArcGIS Pro.
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
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} fullWidth>
              Upload CSV File
              <input type="file" accept=".csv,.txt" hidden onChange={handleFileUpload} />
            </Button>

            <Typography variant="subtitle2">Or Paste CSV Data:</Typography>
            <TextField
              multiline
              rows={8}
              fullWidth
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              sx={{ fontFamily: 'monospace', fontSize: 12 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Latitude Column (Y)"
                  value={latCol}
                  onChange={(e) => setLatCol(e.target.value)}
                  fullWidth
                >
                  {headers.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Longitude Column (X)"
                  value={lonCol}
                  onChange={(e) => setLonCol(e.target.value)}
                  fullWidth
                >
                  {headers.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

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
              Spatial Point Preview
            </Typography>

            <Stack direction="row" spacing={1} my={1}>
              <Chip label={`Valid Point Records: ${features.length}`} color="primary" />
              <Chip label={`Total CSV Rows: ${rows.length}`} color="default" variant="outlined" />
            </Stack>

            <TableContainer sx={{ maxHeight: 250, border: '1px solid', borderColor: 'divider', my: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Lat / Lon</TableCell>
                    <TableCell>Attributes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {features.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {f.coordinates[1]}, {f.coordinates[0]}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {JSON.stringify(f.properties)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {features.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        Select valid Latitude & Longitude columns to preview points.
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
