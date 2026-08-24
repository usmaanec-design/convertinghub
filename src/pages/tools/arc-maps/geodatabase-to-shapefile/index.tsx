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
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LayersIcon from '@mui/icons-material/Layers';
import JSZip from 'jszip';
import { createShapefileZip, SpatialFeature } from '../utils/shapefile';

export default function GeodatabaseToShapefile() {
  const [features, setFeatures] = useState<SpatialFeature[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [layerName, setLayerName] = useState<string>('extracted_shapefile');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFeatures([]);
    setFileName(file.name);

    try {
      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        let jsonStr = '';

        const jsonFile = Object.keys(zip.files).find(
          (f) => f.endsWith('.json') || f.endsWith('.geojson')
        );
        if (jsonFile) {
          jsonStr = await zip.files[jsonFile].async('text');
        } else {
          throw new Error(
            'No readable feature class JSON found inside the Geodatabase package.'
          );
        }

        parseFeatureClassString(jsonStr);
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target?.result as string;
          parseFeatureClassString(text);
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      setError(`Failed to parse Geodatabase container: ${err.message}`);
    }
  };

  const parseFeatureClassString = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const featureList: SpatialFeature[] = [];

      const rawFeatures =
        parsed.features || (Array.isArray(parsed) ? parsed : [parsed]);

      rawFeatures.forEach((f: any) => {
        const geom = f.geometry || f;
        const props = f.properties || f.attributes || {};

        let gType: 'Point' | 'PolyLine' | 'Polygon' = 'Point';
        if (geom.type === 'LineString' || geom.type === 'MultiLineString')
          gType = 'PolyLine';
        else if (geom.type === 'Polygon' || geom.type === 'MultiPolygon')
          gType = 'Polygon';

        featureList.push({
          geometryType: gType,
          coordinates: geom.coordinates || [0, 0],
          properties: props
        });
      });

      setFeatures(featureList);
    } catch (e: any) {
      setError(`Invalid Spatial Database JSON: ${e.message}`);
    }
  };

  const handleDownloadShapefile = async () => {
    if (features.length === 0) return;
    try {
      setIsProcessing(true);
      const blob = await createShapefileZip(
        features,
        layerName || 'extracted_shapefile'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${layerName || 'extracted_layer'}_shapefile.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Error creating Shapefile ZIP: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto', mt: 2 }}>
      <Stack spacing={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <LayersIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            File Geodatabase to ESRI Shapefile Converter
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Extract spatial feature classes from File Geodatabase (.gdb.zip,
          GeoPackage, or Spatial Database JSON) into ESRI Shapefiles (.shp,
          .shx, .dbf, .prj).
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={5}>
          <Stack spacing={2}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
              size="large"
            >
              Upload Geodatabase Package (.zip / .json)
              <input
                type="file"
                accept=".zip,.json,.geojson"
                hidden
                onChange={handleFileUpload}
              />
            </Button>

            {fileName && (
              <Chip
                label={`Package: ${fileName}`}
                color="info"
                variant="outlined"
              />
            )}

            <TextField
              label="Output Shapefile Layer Name"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              fullWidth
            />

            {features.length > 0 && (
              <Box
                p={2}
                border="1px solid"
                borderColor="divider"
                borderRadius={1}
                bgcolor="action.hover"
              >
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Extracted Layer Metadata
                </Typography>
                <Typography variant="body2">
                  <strong>Total Features:</strong> {features.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Geometry Type:</strong> {features[0].geometryType}
                </Typography>
              </Box>
            )}
          </Stack>
        </Grid>

        <Grid item xs={7}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Extracted Feature Class Records
            </Typography>

            {features.length > 0 ? (
              <>
                <TableContainer
                  sx={{
                    maxHeight: 220,
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 2
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Geometry Type</TableCell>
                        <TableCell>Attributes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {features.slice(0, 10).map((f, i) => (
                        <TableRow key={i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{f.geometryType}</TableCell>
                          <TableCell
                            sx={{ fontFamily: 'monospace', fontSize: 11 }}
                          >
                            {JSON.stringify(f.properties)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box mt="auto">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    fullWidth
                    size="large"
                    onClick={handleDownloadShapefile}
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? 'Generating Shapefile...'
                      : 'Download Shapefile (.zip)'}
                  </Button>
                </Box>
              </>
            ) : (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height={300}
                color="text.secondary"
              >
                Upload Geodatabase Package (.zip / .json) to extract Shapefile
                vector layer.
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}
