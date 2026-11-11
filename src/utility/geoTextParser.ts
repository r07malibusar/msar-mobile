import type { GeoPoint } from './w3w';

export interface TextToken {
  text: string;
  isGeoPoint: boolean;
  geoPoint?: GeoPoint;
}

// Regex for What3Words: optional "///" followed by 3 dot-separated words
const W3W_REGEX = /(?:\/\/\/|\b)([a-z]{2,})\.([a-z]{2,})\.([a-z]{2,})\b/gi;

// Regex for Decimal Coordinates: e.g. 34.22323 -118.123232 or 34.22323, -118.123232
const DECIMAL_GPS_REGEX = /\b([-+]?(?:[0-8]?\d\.\d{3,}|90\.0+))[, ]+([-+]?(?:1[0-7]\d|\d)\.\d{3,}|180\.0+)\b/g;

// Regex for DDM (Degrees Decimal Minutes): e.g. 34° 13.3938' N, 118° 07.3939' W or N 34 13.394 W 118 07.394
const DDM_GPS_REGEX = /\b([NS]?\d{1,2}°?\d{1,2}\.\d+'?[NS]?)[, ]+([EW]?\d{1,3}°?\d{1,2}\.\d+'?[EW]?)\b/gi;

function parseDDMString(ddmStr: string): { latitude: number; longitude: number } | null {
  try {
    let latSign = 1;
    let lonSign = 1;

    if (ddmStr.toUpperCase().includes('S')) {
      latSign = -1;
    }
    if (ddmStr.toUpperCase().includes('W')) {
      lonSign = -1;
    }

    const nums = ddmStr.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (nums.length >= 4) {
      const latDeg = nums[0];
      const latMin = nums[1];
      const lonDeg = nums[2];
      const lonMin = nums[3];

      const latitude = latSign * (latDeg + latMin / 60);
      const longitude = lonSign * (lonDeg + lonMin / 60);

      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        return { latitude, longitude };
      }
    }
  }
  catch {
    // Parse fallback
  }
  return null;
}

export function parseGeoPoints(input: string): TextToken[] {
  if (!input) {
    return [{ text: '', isGeoPoint: false }];
  }

  const matches: Array<{ start: number; end: number; token: TextToken }> = [];

  // 1. Match What3Words
  const w3wRegexCopy = new RegExp(W3W_REGEX);
  let match = w3wRegexCopy.exec(input);
  while (match != null) {
    const rawText = match[0];
    const w3wWords = `///${match[1]}.${match[2]}.${match[3]}`;
    matches.push({
      start: match.index,
      end: match.index + rawText.length,
      token: {
        text: rawText,
        isGeoPoint: true,
        geoPoint: {
          rawText,
          type: 'w3w',
          latitude: 0,
          longitude: 0,
          w3wWords,
        },
      },
    });
    match = w3wRegexCopy.exec(input);
  }

  // 2. Match Decimal GPS
  const decRegexCopy = new RegExp(DECIMAL_GPS_REGEX);
  match = decRegexCopy.exec(input);
  while (match != null) {
    const rawText = match[0];
    const lat = Number.parseFloat(match[1]);
    const lon = Number.parseFloat(match[2]);

    if (!Number.isNaN(lat) && !Number.isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      matches.push({
        start: match.index,
        end: match.index + rawText.length,
        token: {
          text: rawText,
          isGeoPoint: true,
          geoPoint: {
            rawText,
            type: 'decimal',
            latitude: lat,
            longitude: lon,
          },
        },
      });
    }
    match = decRegexCopy.exec(input);
  }

  // 3. Match DDM GPS
  const ddmRegexCopy = new RegExp(DDM_GPS_REGEX);
  match = ddmRegexCopy.exec(input);
  while (match != null) {
    const rawText = match[0];
    const parsed = parseDDMString(rawText);
    if (parsed) {
      matches.push({
        start: match.index,
        end: match.index + rawText.length,
        token: {
          text: rawText,
          isGeoPoint: true,
          geoPoint: {
            rawText,
            type: 'ddm',
            latitude: parsed.latitude,
            longitude: parsed.longitude,
          },
        },
      });
    }
    match = ddmRegexCopy.exec(input);
  }

  // Sort matches by start position & remove overlapping matches
  matches.sort((a, b) => a.start - b.start);
  const filteredMatches: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filteredMatches.push(m);
      lastEnd = m.end;
    }
  }

  if (filteredMatches.length === 0) {
    return [{ text: input, isGeoPoint: false }];
  }

  const tokens: TextToken[] = [];
  let currentIndex = 0;

  for (const m of filteredMatches) {
    if (m.start > currentIndex) {
      tokens.push({
        text: input.substring(currentIndex, m.start),
        isGeoPoint: false,
      });
    }
    tokens.push(m.token);
    currentIndex = m.end;
  }

  if (currentIndex < input.length) {
    tokens.push({
      text: input.substring(currentIndex),
      isGeoPoint: false,
    });
  }

  return tokens;
}
