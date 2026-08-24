import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  MenuItem,
  Paper,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Tab,
  Tabs
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import {
  convertCoordinateValue,
  dmsToDecimal,
  decimalToDms,
  decimalToUtm
} from './service';

const SAMPLE_CSV = `Name,Latitude,Longitude
Cairo Tower,30.0444,31.2357
Giza Pyramids,29° 58' 45.12" N,31° 08' 03.12" E
Luxor Temple,25.6997,32.6392
Karnak Temple,25° 43' 07.68" N,32° 39' 26.28" E`;

export default function ArcMapsCoordinateConverter() {
  const [tabIndex, setTabIndex] = useState<number>(0);

  // Single Point State
  const [lat, setLat] = useState<string>('30.0444');
  const [lon, setLon] = useState<string>('31.2357');
  const [format, setFormat] = useState<'dms' | 'dd' | 'utm'>('dms');
  const [singleResult, setSingleResult] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Batch Sheet State
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV);
  const [fileName, setFileName] = useState<string>('');
  const [latCol, setLatCol] = useState<string>('');
  const [lonCol, setLonCol] = useState<string>('');
  const [batchFormat, setBatchFormat] = useState<'dms' | 'dd' | 'utm'>('dms');

  const handleConvertSingle = () => {
    const latConverted = convertCoordinateValue(lat, true, format, lon);
    const lonConverted = convertCoordinateValue(lon, false, format, lat);

    if (format === 'utm') {
      const latDd = dmsToDecimal(lat);
      const lonDd = dmsToDecimal(lon);
      setSingleResult(decimalToUtm(latDd, lonDd));
    } else {
      setSingleResult(`Lat: ${latConverted} | Lon: ${lonConverted}`);
    }
  };

  // Parse CSV headers & rows
  const { headers, rows } = useMemo(() => {
    if (!csvText.trim()) return { headers: [], rows: [] };
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };

    const delimiter = csvText.includes('\t')
      ? '\t'
      : csvText.includes(';')
        ? ';'
        : ',';
    const hdrs = lines[0]
      .split(delimiter)
      .map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const parsedRows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = lines[i]
        .split(delimiter)
        .map((v) => v.trim().replace(/^["']|["']$/g, ''));
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

  // Batch Converted Rows
  const convertedRows = useMemo(() => {
    if (!latCol || !lonCol || rows.length === 0) return [];

    return rows.map((row) => {
      const rawLat = row[latCol] || '';
      const rawLon = row[lonCol] || '';

      const latDd = dmsToDecimal(rawLat);
      const lonDd = dmsToDecimal(rawLon);

      let convLat = '';
      let convLon = '';

      if (batchFormat === 'dms') {
        convLat = decimalToDms(latDd, true);
        convLon = decimalToDms(lonDd, false);
      } else if (batchFormat === 'dd') {
        convLat = isNaN(latDd) ? 'N/A' : latDd.toFixed(6);
        convLon = isNaN(lonDd) ? 'N/A' : lonDd.toFixed(6);
      } else if (batchFormat === 'utm') {
        const utmStr = decimalToUtm(latDd, lonDd);
        convLat = utmStr;
        convLon = utmStr;
      }

      return {
        ...row,
        Converted_Latitude: convLat,
        Converted_Longitude: convLon
      };
    });
  }, [rows, latCol, lonCol, batchFormat]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadCsv = () => {
    if (convertedRows.length === 0) return;
    const allHeaders = [
      ...headers,
      'Converted_Latitude',
      'Converted_Longitude'
    ];
    let csv = allHeaders.join(',') + '\n';

    convertedRows.forEach((r) => {
      const rowObj = r as Record<string, any>;
      const line = allHeaders.map((h) => `"${rowObj[h] ?? ''}"`).join(',');
      csv += line + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${batchFormat}_${
      fileName.replace(/\.[^/.]+$/, '') || 'coordinates'
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySingle = () => {
    navigator.clipboard.writeText(singleResult);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto', mt: 2 }}>
      <Stack spacing={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <ChangeCircleIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            ArcGIS Spatial Coordinate Converter
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Convert single coordinates or upload CSV / Excel spreadsheets to
          convert between Decimal Degrees (DD), Degrees Minutes Seconds (DMS),
          and UTM projections.
        </Typography>
      </Stack>

      <Tabs
        value={tabIndex}
        onChange={(_, val) => setTabIndex(val)}
        sx={{ mb: 3 }}
      >
        <Tab label="Batch Spreadsheet Import (CSV/Excel)" />
        <Tab label="Single Coordinate Converter" />
      </Tabs>

      {/* TAB 0: BATCH SPREADSHEET CONVERTER */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Stack spacing={2}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                fullWidth
                size="large"
              >
                Upload CSV / Excel Sheet
                <input
                  type="file"
                  accept=".csv,.txt,.json"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>

              {fileName && (
                <Chip
                  label={`Loaded File: ${fileName}`}
                  color="info"
                  variant="outlined"
                />
              )}

              {headers.length > 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      select
                      label="Latitude Column"
                      value={latCol}
                      onChange={(e) => setLatCol(e.target.value)}
                      fullWidth
                      size="small"
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
                      label="Longitude Column"
                      value={lonCol}
                      onChange={(e) => setLonCol(e.target.value)}
                      fullWidth
                      size="small"
                    >
                      {headers.map((h) => (
                        <MenuItem key={h} value={h}>
                          {h}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              )}

              <TextField
                select
                label="Target Coordinate Format"
                value={batchFormat}
                onChange={(e) => setBatchFormat(e.target.value as any)}
                fullWidth
              >
                <MenuItem value="dms">Degrees Minutes Seconds (DMS)</MenuItem>
                <MenuItem value="dd">
                  Decimal Degrees (DD / Normal Coordinates)
                </MenuItem>
                <MenuItem value="utm">UTM Projection Zone</MenuItem>
              </TextField>

              <Typography variant="subtitle2">
                Sheet Coordinates Input:
              </Typography>
              <TextField
                multiline
                rows={8}
                fullWidth
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                sx={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Stack>
          </Grid>

          <Grid item xs={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="subtitle2"
                gutterBottom
                color="primary"
                fontWeight="bold"
              >
                Converted Coordinates Preview
              </Typography>

              <Stack direction="row" spacing={1} my={1}>
                <Chip label={`Total Rows: ${rows.length}`} color="primary" />
                <Chip
                  label={`Target: ${batchFormat.toUpperCase()}`}
                  color="secondary"
                />
              </Stack>

              <TableContainer
                sx={{
                  maxHeight: 280,
                  border: '1px solid',
                  borderColor: 'divider',
                  my: 2
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Original Lat/Lon</TableCell>
                      <TableCell>
                        Converted Result ({batchFormat.toUpperCase()})
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {convertedRows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell
                          sx={{ fontFamily: 'monospace', fontSize: 11 }}
                        >
                          {(r as Record<string, any>)[latCol]},{' '}
                          {(r as Record<string, any>)[lonCol]}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: 'primary.main'
                          }}
                        >
                          {batchFormat === 'utm'
                            ? r.Converted_Latitude
                            : `${r.Converted_Latitude}, ${r.Converted_Longitude}`}
                        </TableCell>
                      </TableRow>
                    ))}
                    {convertedRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          Upload a spreadsheet or select valid coordinate
                          columns.
                        </TableCell>
                      </TableRow>
                    )}
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
                  onClick={handleDownloadCsv}
                  disabled={convertedRows.length === 0}
                >
                  Download Converted CSV Sheet
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: SINGLE POINT CONVERTER */}
      {tabIndex === 1 && (
        <Stack spacing={2} maxWidth={600} mx="auto">
          <TextField
            label="Latitude (DD or DMS format)"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            fullWidth
            helperText="Supports DD (e.g. 30.0444) or DMS (e.g. 30° 02' 39.84&quot; N)"
          />
          <TextField
            label="Longitude (DD or DMS format)"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            fullWidth
            helperText="Supports DD (e.g. 31.2357) or DMS (e.g. 31° 14' 08.52&quot; E)"
          />
          <TextField
            select
            label="Target Format / Projection"
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            fullWidth
          >
            <MenuItem value="dms">Degrees Minutes Seconds (DMS)</MenuItem>
            <MenuItem value="dd">Decimal Degrees (DD / Normal)</MenuItem>
            <MenuItem value="utm">UTM Projection Zone</MenuItem>
          </TextField>
          <Button
            variant="contained"
            onClick={handleConvertSingle}
            size="large"
          >
            Convert Coordinate
          </Button>

          {singleResult && (
            <Paper
              variant="outlined"
              sx={{ p: 2, bgcolor: 'action.hover', mt: 2 }}
            >
              <Typography variant="subtitle2" color="primary">
                Converted Result ({format.toUpperCase()}):
              </Typography>
              <Typography
                variant="body1"
                fontWeight="bold"
                sx={{ fontFamily: 'monospace', my: 1 }}
              >
                {singleResult}
              </Typography>
              <Button
                startIcon={<ContentCopyIcon />}
                onClick={handleCopySingle}
                size="small"
              >
                Copy Result
              </Button>
              {copySuccess && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Result copied to clipboard!
                </Alert>
              )}
            </Paper>
          )}
        </Stack>
      )}
    </Paper>
  );
}
