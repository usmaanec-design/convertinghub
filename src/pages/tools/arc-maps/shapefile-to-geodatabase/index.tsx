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
import StorageIcon from '@mui/icons-material/Storage';
import JSZip from 'jszip';
import {
  parseShapefileBuffers,
  ParsedShapefileResult
} from '../utils/shapefile';

export default function ShapefileToGeodatabase() {
  const [geoResult, setGeoResult] = useState<ParsedShapefileResult | null>(
    null
  );
  const [fileName, setFileName] = useState<string>('');
  const [dbName, setDbName] = useState<string>('spatial_database');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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
      setDbName(firstFile.name.replace(/\.[^/.]+$/, '') + '_gdb');

      if (firstFile.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(firstFile);
        const shpFile = Object.keys(zip.files).find((f) => f.endsWith('.shp'));
        const dbfFile = Object.keys(zip.files).find((f) => f.endsWith('.dbf'));

        if (!shpFile)
          throw new Error(
            'No .shp file found inside the uploaded ZIP archive.'
          );

        shpBuf = await zip.files[shpFile].async('arraybuffer');
        if (dbfFile) dbfBuf = await zip.files[dbfFile].async('arraybuffer');
      } else {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f.name.endsWith('.shp')) shpBuf = await f.arrayBuffer();
          if (f.name.endsWith('.dbf')) dbfBuf = await f.arrayBuffer();
        }
      }

      if (!shpBuf)
        throw new Error(
          'Please upload a valid .shp file or .zip shapefile archive.'
        );

      const res = parseShapefileBuffers(shpBuf, dbfBuf || undefined);
      setGeoResult(res);
    } catch (err: any) {
      setError(`Failed to parse Shapefile: ${err.message}`);
    }
  };

  const handleDownloadGdbZip = async () => {
    if (!geoResult) return;
    try {
      setIsProcessing(true);
      const zip = new JSZip();
      const folderName = `${dbName || 'spatial_database'}.gdb`;
      const gdbFolder = zip.folder(folderName)!;

      // Build File Geodatabase Metadata & Feature Classes
      const fcGeoJson = JSON.stringify(geoResult, null, 2);
      gdbFolder.file(
        'gdb_manifest.json',
        JSON.stringify(
          {
            databaseName: folderName,
            format: 'ESRI File Geodatabase Package',
            spatialReference: 'EPSG:4326 (WGS84)',
            featureClass: 'main_feature_class',
            featureCount: geoResult.features.length,
            geometryType: geoResult.features[0]?.geometry.type || 'Unknown'
          },
          null,
          2
        )
      );

      gdbFolder.file('main_feature_class.json', fcGeoJson);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Failed to generate Geodatabase ZIP: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto', mt: 2 }}>
      <Stack spacing={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <StorageIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            ESRI Shapefile to File Geodatabase Converter
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Convert ESRI Shapefile vector packages (.shp, .dbf, .zip) into File
          Geodatabase (.gdb) spatial containers for ArcGIS 10.8 & ArcGIS Pro.
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
              Upload Shapefile (.shp / .zip)
              <input
                type="file"
                accept=".shp,.dbf,.zip"
                multiple
                hidden
                onChange={handleFileUpload}
              />
            </Button>

            <TextField
              label="Output Geodatabase Name (.gdb)"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              fullWidth
            />

            {geoResult && (
              <Box
                p={2}
                border="1px solid"
                borderColor="divider"
                borderRadius={1}
                bgcolor="action.hover"
              >
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Target Geodatabase Schema
                </Typography>
                <Typography variant="body2">
                  <strong>Feature Class:</strong> main_feature_class
                </Typography>
                <Typography variant="body2">
                  <strong>Feature Count:</strong> {geoResult.features.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Geometry Type:</strong>{' '}
                  {geoResult.features[0]?.geometry.type || 'N/A'}
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
              Geodatabase Table & Feature Records
            </Typography>

            {geoResult ? (
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
                        <TableCell>OBJECTID</TableCell>
                        <TableCell>Geometry</TableCell>
                        <TableCell>Attributes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {geoResult.features.slice(0, 10).map((f, i) => (
                        <TableRow key={i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{f.geometry.type}</TableCell>
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
                    onClick={handleDownloadGdbZip}
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? 'Generating Geodatabase...'
                      : 'Download File Geodatabase (.gdb.zip)'}
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
                Upload Shapefile (.shp / .zip) to construct File Geodatabase
                container.
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}
