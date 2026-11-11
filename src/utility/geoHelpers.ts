import { Linking, Platform } from 'react-native';

/** Check if two date objects match the same day portion */
export function datePortionEqual(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

/** Format Decimal Degrees latitude/longitude */
export function formatDecimal(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

/** Format Degrees Decimal Minutes (DDM) format (e.g. 34° 05.8080' N, 118° 43.9260' W) */
export function formatDDM(lat: number, lon: number): string {
  const latRef = lat >= 0 ? 'N' : 'S';
  const absLat = Math.abs(lat);
  const latDeg = Math.floor(absLat);
  const latMin = ((absLat - latDeg) * 60).toFixed(4);

  const lonRef = lon >= 0 ? 'E' : 'W';
  const absLon = Math.abs(lon);
  const lonDeg = Math.floor(absLon);
  const lonMin = ((absLon - lonDeg) * 60).toFixed(4);

  return `${latDeg}° ${latMin}' ${latRef}, ${lonDeg}° ${lonMin}' ${lonRef}`;
}

/** Open default phone map app (Apple Maps / Google Maps) to coordinates */
export function openMapsApp(lat: number, lon: number, labelText?: string) {
  const label = encodeURIComponent(labelText || 'Location');

  if (Platform.OS === 'ios') {
    const url = `maps:0,0?q=${label}@${lat},${lon}`;
    Linking.openURL(url);
  }
  else {
    const url = `geo:0,0?q=${lat},${lon}(${label})`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
    });
  }
}

/** Open CalTopo mobile app (or fallback to CalTopo web map) */
export function openCalTopo(lat: number, lon: number) {
  const caltopoUrl = `caltopo://ll?lat=${lat}&lon=${lon}`;
  const caltopoWebUrl = `https://caltopo.com/map.html#ll=${lat},${lon}&z=15`;

  Linking.openURL(caltopoUrl).catch(() => {
    Linking.openURL(caltopoWebUrl);
  });
}
