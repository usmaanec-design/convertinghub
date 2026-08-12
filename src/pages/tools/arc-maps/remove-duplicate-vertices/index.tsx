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
  Slider,
  FormControlLabel,
  Checkbox,
  Alert,
  MenuItem
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';

const SAMPLE_COORDINATES = `Latitude,Longitude,LocationName
30.0444,31.2357,Cairo Tower
30.0444,31.2357,Cairo Tower Duplicate
30.0446,31.2360,Nile Plaza
30.0448,31.2363,Opera House
30.0450,31.2370,Tahrir Square
30.0450,31.2370,Tahrir Square Duplicate
30.0450,31.2380,Museum Entry
30.0450,31.2390,Downtown
30.0450,31.2400,Station`;

function extractPointsFromText(text: string, latCol?: string, lonCol?: string): { pts: [number, number][]; headers: string[] } {
  const points: [number, number][] = [];
  let headers: string[] = [];

  if (!text.trim()) return { pts: [], headers: [] };

  // Try JSON / GeoJSON first
  try {
    const parsed = JSON.parse(text);
    const extracted = recursiveExtract(parsed);
    if (extracted.length > 0) return { pts: extracted, headers: ['X', 'Y'] };
  } catch {
    // Fallback: CSV or plain lines
  }

  const lines = text.trim().split('\n');
  if (lines.length === 0) return { pts: [], headers: [] };

  const delimiter = text.includes('\t') ? '\t' : text.includes(';') ? ';' : ',';
  const firstLineParts = lines[0].split(delimiter).map((s) => s.trim().replace(/^["']|["']$/g, ''));

  // Check if first line is a header
  const isHeader = firstLineParts.some((p) => isNaN(Number(p)));

  let targetLatIdx = -1;
  let targetLonIdx = -1;

  if (isHeader) {
    headers = firstLineParts;
    const lower = headers.map((h) => h.toLowerCase());

    if (latCol) targetLatIdx = headers.indexOf(latCol);
    else targetLatIdx = lower.findIndex((h) => ['lat', 'latitude', 'y', 'lat_dd', 'north'].includes(h));

    if (lonCol) targetLonIdx = headers.indexOf(lonCol);
    else targetLonIdx = lower.findIndex((h) => ['lon', 'lng', 'longitude', 'x', 'lon_dd', 'east'].includes(h));
  }

  const startLine = isHeader ? 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line
      .replace(/[\[\]]/g, '')
      .split(delimiter)
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .map(Number);

    if (targetLatIdx !== -1 && targetLonIdx !== -1) {
      const lat = parts[targetLatIdx];
      const lon = parts[targetLonIdx];
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push([lon, lat]);
      }
    } else {
      const nums = parts.filter((n) => !isNaN(n));
      if (nums.length >= 2) {
        points.push([nums[0], nums[1]]);
      }
    }
  }

  return { pts: points, headers };
}

function recursiveExtract(data: any): [number, number][] {
  const points: [number, number][] = [];

  function helper(item: any) {
    if (!item) return;
    if (Array.isArray(item)) {
      if (
        item.length === 2 &&
        typeof item[0] === 'number' &&
        typeof item[1] === 'number' &&
        !isNaN(item[0]) &&
        !isNaN(item[1])
      ) {
        points.push([item[0], item[1]]);
      } else if (item.length > 2 && item.every((x) => typeof x === 'number')) {
        for (let i = 0; i < item.length - 1; i += 2) {
          if (!isNaN(item[i]) && !isNaN(item[i + 1])) {
            points.push([item[i], item[i + 1]]);
          }
        }
      } else {
        item.forEach(helper);
      }
    } else if (typeof item === 'object') {
      if (item.type === 'FeatureCollection' && Array.isArray(item.features)) {
        item.features.forEach(helper);
      } else if (item.type === 'Feature' && item.geometry) {
        helper(item.geometry.coordinates);
      } else if (item.coordinates) {
        helper(item.coordinates);
      }
    }
  }

  helper(data);
  return points;
}

export default function RemoveDuplicateVertices() {
  const [inputData, setInputData] = useState<string>(SAMPLE_COORDINATES);
  const [fileName, setFileName] = useState<string>('');
  const [selectedLatCol, setSelectedLatCol] = useState<string>('');
  const [selectedLonCol, setSelectedLonCol] = useState<string>('');
  const [distTolerance, setDistTolerance] = useState<number>(0.00001);
  const [angleTolerance, setAngleTolerance] = useState<number>(1.0);
  const [preserveEndPoints, setPreserveEndPoints] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Extract raw coordinates & headers
  const { rawPts, headers } = useMemo(() => {
    const { pts, headers: hdrs } = extractPointsFromText(inputData, selectedLatCol, selectedLonCol);
    return { rawPts: pts, headers: hdrs };
  }, [inputData, selectedLatCol, selectedLonCol]);

  // Initial exact duplicates detection (at distTolerance = 0)
  const initialDuplicateStats = useMemo(() => {
    if (rawPts.length === 0) return { total: 0, duplicates: 0, unique: 0 };
    const seen = new Set<string>();
    let dupes = 0;
    rawPts.forEach(([x, y]) => {
      const key = `${x.toFixed(7)},${y.toFixed(7)}`;
      if (seen.has(key)) dupes++;
      else seen.add(key);
    });
    return { total: rawPts.length, duplicates: dupes, unique: rawPts.length - dupes };
  }, [rawPts]);

  // Deduplication & collinear cleaning algorithm driven by slider
  const cleanedCoords = useMemo(() => {
    if (rawPts.length === 0) return [];

    // Step 1: Remove exact or close duplicates (distance tolerance slider)
    const step1: [number, number][] = [];
    rawPts.forEach((pt) => {
      if (step1.length === 0) {
        step1.push(pt);
      } else {
        const prev = step1[step1.length - 1];
        const dist = Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
        if (dist > distTolerance) {
          step1.push(pt);
        }
      }
    });

    // Step 2: Remove collinear vertices (angle threshold)
    const step2: [number, number][] = [];
    if (step1.length <= 2) return step1;

    step2.push(step1[0]); // Always keep start point

    for (let i = 1; i < step1.length - 1; i++) {
      const prev = step2[step2.length - 1];
      const curr = step1[i];
      const next = step1[i + 1];

      const v1 = [curr[0] - prev[0], curr[1] - prev[1]];
      const v2 = [next[0] - curr[0], next[1] - curr[1]];

      const mag1 = Math.hypot(v1[0], v1[1]);
      const mag2 = Math.hypot(v2[0], v2[1]);

      if (mag1 === 0 || mag2 === 0) continue;

      const dot = (v1[0] * v2[0] + v1[1] * v2[1]) / (mag1 * mag2);
      const clampedDot = Math.max(-1, Math.min(1, dot));
      const angleDeg = (Math.acos(clampedDot) * 180) / Math.PI;

      if (angleDeg > angleTolerance) {
        step2.push(curr);
      }
    }

    if (preserveEndPoints || step2.length === 1) {
      step2.push(step1[step1.length - 1]);
    }

    return step2;
  }, [rawPts, distTolerance, angleTolerance, preserveEndPoints]);

  const originalCount = rawPts.length;
  const cleanedCount = cleanedCoords.length;
  const removedCount = originalCount - cleanedCount;
  const reductionPct = originalCount > 0 ? Math.round((removedCount / originalCount) * 100) : 0;

  const outputFormatted = useMemo(() => {
    return JSON.stringify(cleanedCoords, null, 2);
  }, [cleanedCoords]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setInputData(text);
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputFormatted);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csvHeader = 'Longitude,Latitude\n';
    const csvBody = cleanedCoords.map(([lon, lat]) => `${lon},${lat}`).join('\n');
    const blob = new Blob([csvHeader + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_${fileName.replace(/\.[^/.]+$/, '') || 'vertices'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: cleanedCoords
          },
          properties: { cleaned: true, originalVertices: originalCount, cleanedVertices: cleanedCount }
        }
      ]
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_${fileName.replace(/\.[^/.]+$/, '') || 'vertices'}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SVG Preview Bounds
  const svgBounds = useMemo(() => {
    const validPts = rawPts.filter(
      (pt): pt is [number, number] =>
        Array.isArray(pt) &&
        pt.length >= 2 &&
        typeof pt[0] === 'number' &&
        typeof pt[1] === 'number' &&
        !isNaN(pt[0]) &&
        !isNaN(pt[1])
    );
    if (validPts.length === 0) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    validPts.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });

    const paddingX = (maxX - minX) * 0.1 || 0.001;
    const paddingY = (maxY - minY) * 0.1 || 0.001;
    return {
      minX: minX - paddingX,
      minY: minY - paddingY,
      width: maxX - minX + paddingX * 2,
      height: maxY - minY + paddingY * 2
    };
  }, [rawPts]);

  return (
    <Paper sx={{ p: 3, maxWidth: 950, mx: 'auto', mt: 2 }}>
      <Stack spacing={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <CleaningServicesIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            Remove Duplicate & Collinear Vertices
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Upload CSV / Excel / GeoJSON coordinate spreadsheets to automatically detect total locations, detect duplicate vertices, and dynamically clean vertices using the distance tolerance slider.
        </Typography>
      </Stack>

      {/* Auto Detection Summary Banner */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
          Sheet Auto-Detection Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Chip label={`Total Locations: ${initialDuplicateStats.total}`} color="default" />
          <Chip
            label={`Detected Duplicate Vertices: ${initialDuplicateStats.duplicates}`}
            color={initialDuplicateStats.duplicates > 0 ? 'warning' : 'success'}
          />
          <Chip label={`Unique Locations: ${initialDuplicateStats.unique}`} color="info" />
          {fileName && <Chip label={`Loaded File: ${fileName}`} variant="outlined" color="primary" />}
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <Button variant="contained" component="label" startIcon={<UploadFileIcon />} fullWidth size="large">
              Upload CSV / Spreadsheet / GeoJSON File
              <input type="file" accept=".csv,.txt,.json,.geojson,.kml" hidden onChange={handleFileUpload} />
            </Button>

            {headers.length > 0 && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Latitude Column (Y)"
                    value={selectedLatCol}
                    onChange={(e) => setSelectedLatCol(e.target.value)}
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
                    label="Longitude Column (X)"
                    value={selectedLonCol}
                    onChange={(e) => setSelectedLonCol(e.target.value)}
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

            <Typography variant="subtitle2">Coordinates Data Input (CSV / GeoJSON / Text):</Typography>
            <TextField
              multiline
              rows={9}
              fullWidth
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Upload file or paste CSV / JSON coordinates..."
              sx={{ fontFamily: 'monospace', fontSize: 12 }}
            />

            <Box mt={1} p={2} border="1px solid" borderColor="divider" borderRadius={1}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                Interactive Drag-to-Deduplicate Slider
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Drag slider to dynamically clean duplicate vertices within distance threshold:
              </Typography>
              <Slider
                value={distTolerance}
                min={0}
                max={0.01}
                step={0.00001}
                onChange={(_, val) => setDistTolerance(val as number)}
                valueLabelDisplay="auto"
                sx={{ mt: 1 }}
              />

              <Typography variant="subtitle2" gutterBottom mt={2}>
                Collinear Angle Threshold ({angleTolerance}°)
              </Typography>
              <Slider
                value={angleTolerance}
                min={0}
                max={15}
                step={0.5}
                onChange={(_, val) => setAngleTolerance(val as number)}
                valueLabelDisplay="auto"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={preserveEndPoints}
                    onChange={(e) => setPreserveEndPoints(e.target.checked)}
                  />
                }
                label="Preserve start & end vertices"
              />
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" gutterBottom>
              Path Cleaning Live Statistics
            </Typography>

            <Stack direction="row" spacing={1} my={1} flexWrap="wrap" gap={1}>
              <Chip label={`Original: ${originalCount}`} color="default" variant="outlined" />
              <Chip label={`Cleaned: ${cleanedCount}`} color="success" />
              <Chip label={`Removed: ${removedCount}`} color="warning" />
              <Chip label={`Reduced: ${reductionPct}%`} color="primary" />
            </Stack>

            {/* Visual SVG Map Path Preview */}
            <Typography variant="caption" color="text.secondary" mt={1}>
              Visual Path Map (Grey = Original, Green = Cleaned)
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 180,
                bgcolor: 'grey.900',
                borderRadius: 1,
                mt: 1,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {svgBounds && (
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`${svgBounds.minX} ${-svgBounds.minY - svgBounds.height} ${svgBounds.width} ${svgBounds.height}`}
                >
                  <polyline
                    fill="none"
                    stroke="#666"
                    strokeWidth={svgBounds.width / 150}
                    strokeDasharray="2,2"
                    points={rawPts
                      .filter((pt): pt is [number, number] => Array.isArray(pt) && pt.length >= 2)
                      .map(([x, y]) => `${x},${-y}`)
                      .join(' ')}
                  />
                  {rawPts
                    .filter((pt): pt is [number, number] => Array.isArray(pt) && pt.length >= 2)
                    .map(([x, y], i) => (
                      <circle key={`orig-${i}`} cx={x} cy={-y} r={svgBounds.width / 100} fill="#888" />
                    ))}
                  <polyline
                    fill="none"
                    stroke="#4caf50"
                    strokeWidth={svgBounds.width / 100}
                    points={cleanedCoords
                      .filter((pt): pt is [number, number] => Array.isArray(pt) && pt.length >= 2)
                      .map(([x, y]) => `${x},${-y}`)
                      .join(' ')}
                  />
                  {cleanedCoords
                    .filter((pt): pt is [number, number] => Array.isArray(pt) && pt.length >= 2)
                    .map(([x, y], i) => (
                      <circle key={`clean-${i}`} cx={x} cy={-y} r={svgBounds.width / 80} fill="#4caf50" />
                    ))}
                </svg>
              )}
            </Box>

            <Typography variant="subtitle2" mt={2} gutterBottom>
              Cleaned Coordinates Output
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              InputProps={{ readOnly: true }}
              value={outputFormatted}
              sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: 'action.hover' }}
            />

            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" gap={1}>
              <Button
                variant="contained"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
                disabled={cleanedCoords.length === 0}
                size="small"
              >
                Copy Output
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadCsv}
                disabled={cleanedCoords.length === 0}
                size="small"
              >
                Download CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadGeoJSON}
                disabled={cleanedCoords.length === 0}
                size="small"
              >
                Download GeoJSON
              </Button>
            </Stack>

            {copySuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Copied cleaned coordinates to clipboard!
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}
