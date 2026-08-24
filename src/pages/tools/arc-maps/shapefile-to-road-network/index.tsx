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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import JSZip from 'jszip';
import {
  parseShapefileBuffers,
  ParsedShapefileResult
} from '../utils/shapefile';

interface NetworkEdge {
  edgeId: number;
  nodeFrom: number;
  nodeTo: number;
  lengthKm: number;
  attributes: Record<string, any>;
  coordinates: [number, number][];
}

interface NetworkNode {
  nodeId: number;
  coordinates: [number, number];
  degree: number;
}

export default function ShapefileToRoadNetwork() {
  const [geoResult, setGeoResult] = useState<ParsedShapefileResult | null>(
    null
  );
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
      setError(`Failed to parse PolyLine Shapefile: ${err.message}`);
    }
  };

  // Build Road Network Topology (Nodes & Edges)
  const { nodes, edges } = useMemo(() => {
    if (!geoResult || geoResult.features.length === 0)
      return { nodes: [], edges: [] };

    const nodeMap = new Map<string, NetworkNode>();
    const edgeList: NetworkEdge[] = [];
    let nextNodeId = 1;
    let nextEdgeId = 1;

    const getNode = (coord: [number, number]): NetworkNode => {
      const key = `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
      if (nodeMap.has(key)) {
        const existing = nodeMap.get(key)!;
        existing.degree++;
        return existing;
      }
      const newNode: NetworkNode = {
        nodeId: nextNodeId++,
        coordinates: coord,
        degree: 1
      };
      nodeMap.set(key, newNode);
      return newNode;
    };

    geoResult.features.forEach((feat) => {
      const gType = feat.geometry.type;
      const coords = feat.geometry.coordinates;

      const lines: [number, number][][] =
        gType === 'MultiLineString'
          ? coords
          : gType === 'LineString'
            ? [coords]
            : [];

      lines.forEach((line) => {
        if (line.length >= 2) {
          const startNode = getNode(line[0]);
          const endNode = getNode(line[line.length - 1]);

          // Compute length in kilometers (Haversine approx)
          let lengthKm = 0;
          for (let i = 0; i < line.length - 1; i++) {
            lengthKm += haversineKm(line[i], line[i + 1]);
          }

          edgeList.push({
            edgeId: nextEdgeId++,
            nodeFrom: startNode.nodeId,
            nodeTo: endNode.nodeId,
            lengthKm: parseFloat(lengthKm.toFixed(3)),
            attributes: feat.properties || {},
            coordinates: line
          });
        }
      });
    });

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
  }, [geoResult]);

  const outputJsonString = useMemo(() => {
    if (edges.length === 0) return '';
    return JSON.stringify(
      { networkNodes: nodes, networkEdges: edges },
      null,
      2
    );
  }, [nodes, edges]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputJsonString);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadCsv = () => {
    let csv = 'EdgeID,NodeFrom,NodeTo,LengthKm,Coordinates\n';
    edges.forEach((e) => {
      csv += `${e.edgeId},${e.nodeFrom},${e.nodeTo},${
        e.lengthKm
      },"${JSON.stringify(e.coordinates)}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${
      fileName.replace(/\.[^/.]+$/, '') || 'road'
    }_network_edges.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        ...nodes.map((n) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: n.coordinates },
          properties: {
            nodeType: 'JunctionNode',
            nodeId: n.nodeId,
            degree: n.degree
          }
        })),
        ...edges.map((e) => ({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: e.coordinates },
          properties: {
            edgeId: e.edgeId,
            nodeFrom: e.nodeFrom,
            nodeTo: e.nodeTo,
            lengthKm: e.lengthKm,
            ...e.attributes
          }
        }))
      ]
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${
      fileName.replace(/\.[^/.]+$/, '') || 'road'
    }_network_topology.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto', mt: 2 }}>
      <Stack spacing={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <AltRouteIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            Shapefile to Road Network Topology Extractor
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Extract topological node-link graph networks, junction nodes, and road
          edge segments from polyline Shapefiles.
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
              Upload PolyLine Shapefile (.shp / .zip)
              <input
                type="file"
                accept=".shp,.dbf,.zip"
                multiple
                hidden
                onChange={handleFileUpload}
              />
            </Button>

            {fileName && (
              <Chip
                label={`Selected: ${fileName}`}
                color="info"
                variant="outlined"
              />
            )}

            {edges.length > 0 && (
              <Box
                p={2}
                border="1px solid"
                borderColor="divider"
                borderRadius={1}
                bgcolor="action.hover"
              >
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Network Graph Topology Metrics
                </Typography>
                <Typography variant="body2">
                  <strong>Junction Nodes:</strong> {nodes.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Road Edges / Segments:</strong> {edges.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Network Length:</strong>{' '}
                  {edges.reduce((sum, e) => sum + e.lengthKm, 0).toFixed(2)} km
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
              Road Edge Network Topology Table
            </Typography>

            {edges.length > 0 ? (
              <>
                <TableContainer
                  sx={{
                    maxHeight: 180,
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 2
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>EdgeID</TableCell>
                        <TableCell>NodeFrom → NodeTo</TableCell>
                        <TableCell>Length (km)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {edges.slice(0, 10).map((e) => (
                        <TableRow key={e.edgeId}>
                          <TableCell>{e.edgeId}</TableCell>
                          <TableCell>
                            Node {e.nodeFrom} → Node {e.nodeTo}
                          </TableCell>
                          <TableCell>{e.lengthKm} km</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TextField
                  multiline
                  rows={6}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  value={outputJsonString}
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    bgcolor: 'action.hover'
                  }}
                />

                <Stack direction="row" spacing={2} mt={2}>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopy}
                  >
                    Copy Network JSON
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadCsv}
                  >
                    Download Edges CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadGeoJSON}
                  >
                    Download Topology GeoJSON
                  </Button>
                </Stack>

                {copySuccess && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Road Network JSON copied to clipboard!
                  </Alert>
                )}
              </>
            ) : (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height={300}
                color="text.secondary"
              >
                Upload polyline shapefile to extract node-link road network
                topology.
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}

function haversineKm(p1: [number, number], p2: [number, number]): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
  const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[1] * Math.PI) / 180) *
      Math.cos((p2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
