import type { CustomMatcher } from 'react-native-autolink';
import type { GeoPoint } from './w3w';
import colors from '@styles/colors';

const W3W_REGEX = /(?:\/\/\/|w3w[./]|w3w:|\b)([a-z]{2,})\.([a-z]{2,})\.([a-z]{2,})\b/gi;
const DECIMAL_GPS_REGEX = /\b([-+]?(?:[0-8]?\d\.\d{3,}|90\.0+))[, ]+([-+]?(?:1[0-7]\d|\d)\.\d{3,}|180\.0+)\b/g;
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

export function createGeoMatchers(onGeoPress: (geoPoint: GeoPoint) => void): CustomMatcher[] {
  const linkStyle = {
    color: colors.secondaryYellow,
    textDecorationLine: 'underline' as const,
    fontWeight: '600' as const,
  };

  const w3wMatcher: CustomMatcher = {
    pattern: W3W_REGEX,
    type: 'w3w',
    style: linkStyle,
    onPress: (match) => {
      const replacerArgs = match.getReplacerArgs();
      const rawText = replacerArgs[0];
      const word1 = (replacerArgs[1] || '').toLowerCase();
      const word2 = (replacerArgs[2] || '').toLowerCase();
      const word3 = (replacerArgs[3] || '').toLowerCase();
      const words = `///${word1}.${word2}.${word3}`;
      onGeoPress({
        rawText,
        type: 'w3w',
        latitude: 0,
        longitude: 0,
        w3wWords: words,
      });
    },
  };

  const decimalGpsMatcher: CustomMatcher = {
    pattern: DECIMAL_GPS_REGEX,
    type: 'decimalGps',
    style: linkStyle,
    onPress: (match) => {
      const replacerArgs = match.getReplacerArgs();
      const rawText = replacerArgs[0];
      const lat = Number.parseFloat(replacerArgs[1]);
      const lon = Number.parseFloat(replacerArgs[2]);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        onGeoPress({
          rawText,
          type: 'decimal',
          latitude: lat,
          longitude: lon,
        });
      }
    },
  };

  const ddmGpsMatcher: CustomMatcher = {
    pattern: DDM_GPS_REGEX,
    type: 'ddmGps',
    style: linkStyle,
    onPress: (match) => {
      const replacerArgs = match.getReplacerArgs();
      const rawText = replacerArgs[0];
      const parsed = parseDDMString(rawText);
      if (parsed) {
        onGeoPress({
          rawText,
          type: 'ddm',
          latitude: parsed.latitude,
          longitude: parsed.longitude,
        });
      }
    },
  };

  return [w3wMatcher, decimalGpsMatcher, ddmGpsMatcher];
}
