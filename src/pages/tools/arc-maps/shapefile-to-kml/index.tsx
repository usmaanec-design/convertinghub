import { useState } from 'react';
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MapIcon from '@mui/icons-material/Map';
import JSZip from 'jszip';
import { parseShapefileBuffers, ParsedShapefileResult } from '../utils/shapefile';

export default function ShapefileToKmlConverter() {
  const [geoResult, setGeoResult] = useState<ParsedShapefileResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setGeoResult(null);

    let shpBuf: ArrayBuffer | null = null;
    let dbfBuf: ArrayBuffer | null = null;

    try {
      const firstFile = files[0];
      setFileName(firstFile.name);

      if (firstFile.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(firstFile);
        const shpFile = Object.keys(zip.files).find((f) => f.endsWith('.shp'));
        const dbfFile = Object.keys(zip.files).find((f) => f.endsWith('.dbf'));

        if (!shpFile) throw new Error('No .shp file found inside the uploaded ZIP archive.');

        shpBuf = await zip.files[shpFile].async('arraybuffer');
        if (dbfFile) dbfBuf = await zip.files[dbfFile].async('arraybuffer');
      } else {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f.name.endsWith('.shp')) shpBuf = await f.arrayBuffer();
          if (f.name.endsWith('.dbf')) dbfBuf = await f.arrayBuffer();
        }
      }

      if (!shpBuf) throw new Error('Please upload a valid .shp file or .zip shapefile archive.');

      const res = parseShapefileBuffers(shpBuf, dbfBuf || undefined);
      setGeoResult(res);
    } catch (err: any) {
      setError(`Failed to parse Shapefile: ${err.message}`);
    }
  };

  const kmlString = useMemoKml(geoResult, fileName);

  const handleCopy = () => {
    navigator.clipboard.writeText(kmlString);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    if (!geoResult) return;
    const blob = new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, '') || 'shapefile'}.kml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto', mt: 2 }}>
      <Stack spacing={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <MapIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            ESRI Shapefile to Google Earth KML Converter
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Convert ESRI Shapefile vector layers (.shp, .dbf, or .zip packages) into Google Earth KML format.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
              size="large"
            >
              Upload Shapefile (.shp / .zip)
              <input type="file" accept=".shp,.dbf,.zip" multiple hidden onChange={handleFileUpload} />
            </Button>

            {fileName && <Chip label={`Selected: ${fileName}`} color="info" variant="outlined" />}

            {geoResult && (
              <Box p={2} border="1px solid" borderColor="divider" borderRadius={1} bgcolor="action.hover">
                <Typography variant="subtitle2" gutterBottom>
                  Shapefile Layer Info
                </Typography>
                <Typography variant="body2">
                  <strong>Features Count:</strong> {geoResult.features.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Geometry Type:</strong> {geoResult.features[0]?.geometry.type || 'N/A'}
                </Typography>
              </Box>
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" gutterBottom>
              Generated KML Output Preview
            </Typography>

            {geoResult ? (
              <>
                <TableContainer sx={{ maxHeight: 180, border: '1px solid', borderColor: 'divider', mb: 2 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Name / Properties</TableCell>
                        <TableCell>Geometry</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {geoResult.features.slice(0, 10).map((f, i) => (
                        <TableRow key={i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{f.properties?.Name || f.properties?.name || `Placemark_${i + 1}`}</TableCell>
                          <TableCell>{f.geometry.type}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TextField
                  multiline
                  rows={8}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  value={kmlString}
                  sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: 'action.hover' }}
                />

                <Stack direction="row" spacing={2} mt={2}>
                  <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={handleCopy}>
                    Copy KML
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
                    Download .kml
                  </Button>
                </Stack>

                {copySuccess && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    KML copied to clipboard!
                  </Alert>
                )}
              </>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height={300} color="text.secondary">
                Upload a .shp file or .zip shapefile archive to generate KML XML.
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}

function useMemoKml(geoResult: ParsedShapefileResult | null, layerName: string): string {
  if (!geoResult || geoResult.features.length === 0) return '';

  const docName = layerName.replace(/\.[^/.]+$/, '') || 'Shapefile_Layer';
  let placemarksXml = '';

  geoResult.features.forEach((feat, idx) => {
    const name = feat.properties?.Name || feat.properties?.NAME || feat.properties?.name || `Feature_${idx + 1}`;
    let extDataXml = '<ExtendedData>\n';
    Object.entries(feat.properties || {}).forEach(([k, v]) => {
      extDataXml += `        <Data name="${k}"><value>${v}</value></Data>\n`;
    });
    extDataXml += '      </ExtendedData>';

    let geomXml = '';
    const gType = feat.geometry.type;
    const coords = feat.geometry.coordinates;

    if (gType === 'Point') {
      geomXml = `<Point><coordinates>${coords[0]},${coords[1]},0</coordinates></Point>`;
    } else if (gType === 'LineString') {
      const cStr = coords.map(([x, y]: [number, number]) => `${x},${y},0`).join(' ');
      geomXml = `<LineString><coordinates>${cStr}</coordinates></LineString>`;
    } else if (gType === 'Polygon') {
      const ring = Array.isArray(coords[0][0]) ? coords[0] : coords;
      const cStr = ring.map(([x, y]: [number, number]) => `${x},${y},0`).join(' ');
      geomXml = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${cStr}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
    }

    placemarksXml += `    <Placemark>\n      <name>${name}</name>\n      ${extDataXml}\n      ${geomXml}\n    </Placemark>\n`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${docName}</name>
${placemarksXml}  </Document>
</kml>`;
}
