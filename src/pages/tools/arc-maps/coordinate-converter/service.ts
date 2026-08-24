export function dmsToDecimal(dmsStr: string | number): number {
  if (typeof dmsStr === 'number') return dmsStr;
  const str = String(dmsStr).trim();
  if (!str) return NaN;

  // Check if it's already a decimal number
  const directNum = Number(str);
  if (!isNaN(directNum)) return directNum;

  // Extract degrees, minutes, seconds, and direction (N/S/E/W)
  const isNegative =
    str.includes('S') || str.includes('W') || str.startsWith('-');
  const cleanStr = str.replace(/[^\d.\s]/g, ' ').trim();
  const parts = cleanStr
    .split(/\s+/)
    .map(Number)
    .filter((n) => !isNaN(n));

  if (parts.length === 0) return NaN;

  const deg = parts[0] || 0;
  const min = parts[1] || 0;
  const sec = parts[2] || 0;

  let decimal = deg + min / 60 + sec / 3600;
  if (isNegative) decimal = -decimal;

  return decimal;
}

export function decimalToDms(val: number, isLat: boolean): string {
  if (isNaN(val)) return 'N/A';
  const absVal = Math.abs(val);
  const deg = Math.floor(absVal);
  const minFloat = (absVal - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(2);
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W';

  return `${deg}° ${min}' ${sec}" ${dir}`;
}

export function decimalToUtm(lat: number, lon: number): string {
  if (isNaN(lat) || isNaN(lon)) return 'N/A';
  const zone = Math.floor((lon + 180) / 6) + 1;
  const band = lat >= 0 ? 'N' : 'S';

  // WGS84 UTM approximate Easting & Northing
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const centralMeridian = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);
  const dLon = lonRad - centralMeridian;

  const easting = Math.round(500000 + 6378137 * dLon * Math.cos(latRad));
  let northing = Math.round(6378137 * latRad);
  if (lat < 0) northing += 10000000;

  return `Zone ${zone}${band} E:${easting}m N:${northing}m`;
}

export function convertCoordinateValue(
  inputVal: string | number,
  isLat: boolean,
  targetFormat: 'dd' | 'dms' | 'utm',
  pairVal?: string | number
): string {
  const dd = typeof inputVal === 'number' ? inputVal : dmsToDecimal(inputVal);
  if (isNaN(dd)) return 'Invalid';

  if (targetFormat === 'dms') {
    return decimalToDms(dd, isLat);
  }

  if (targetFormat === 'utm') {
    const otherDd =
      pairVal !== undefined
        ? typeof pairVal === 'number'
          ? pairVal
          : dmsToDecimal(pairVal)
        : 0;
    const lat = isLat ? dd : otherDd;
    const lon = isLat ? otherDd : dd;
    return decimalToUtm(lat, lon);
  }

  return dd.toFixed(6);
}
