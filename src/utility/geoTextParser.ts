import type { GeoPoint } from './w3w';

export interface TextToken {
  text: string;
  type: 'text' | 'w3w' | 'decimal' | 'ddm' | 'phone' | 'email' | 'url';
  geoPoint?: GeoPoint;
  linkUrl?: string;
}

// Regex patterns
const W3W_REGEX = /(?:\/\/\/|w3w[./]|w3w:|\b)([a-z]{2,})\.([a-z]{2,})\.([a-z]{2,})\b/gi;
const DECIMAL_GPS_REGEX = /\b([-+]?(?:[0-8]?\d\.\d{3,}|90\.0+))[, ]+([-+]?(?:1[0-7]\d|\d)\.\d{3,}|180\.0+)\b/g;
const DDM_GPS_REGEX = /\b([NS]?\d{1,2}°?\d{1,2}\.\d+'?[NS]?)[, ]+([EW]?\d{1,3}°?\d{1,2}\.\d+'?[EW]?)\b/gi;
const US_PHONE_REGEX = /(?:\+?1[-. ]?)?\(?([2-9]\d{2})\)?[-. ]?(\d{3})[-. ]?(\d{4})\b/g;
const EMAIL_REGEX = /\b[\w.%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi;
const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s<]+\b/gi;

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
    return [{ text: '', type: 'text' }];
  }

  const matches: Array<{ start: number; end: number; token: TextToken }> = [];

  // 1. Match What3Words
  const w3wRegexCopy = new RegExp(W3W_REGEX);
  let match = w3wRegexCopy.exec(input);
  while (match != null) {
    const rawText = match[0];
    const word1 = (match[1] || '').toLowerCase();
    const word2 = (match[2] || '').toLowerCase();
    const word3 = (match[3] || '').toLowerCase();
    const w3wWords = `///${word1}.${word2}.${word3}`;
    matches.push({
      start: match.index,
      end: match.index + rawText.length,
      token: {
        text: rawText,
        type: 'w3w',
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
          type: 'decimal',
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
          type: 'ddm',
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

  // 4. Match US Phone Numbers
  const phoneRegexCopy = new RegExp(US_PHONE_REGEX);
  match = phoneRegexCopy.exec(input);
  while (match != null) {
    const rawText = match[0];
    const digits = rawText.replace(/\D/g, '');
    const phoneDigits = digits.length === 10 ? `1${digits}` : digits;
    matches.push({
      start: match.index,
      end: match.index + rawText.length,
      token: {
        text: rawText,
        type: 'phone',
        linkUrl: `tel:${phoneDigits}`,
      },
    });
    match = phoneRegexCopy.exec(input);
  }

  // 5. Match Emails
  const emailRegexCopy = new RegExp(EMAIL_REGEX);
  match = emailRegexCopy.exec(input);
  while (match != null) {
    const rawText = match[0];
    matches.push({
      start: match.index,
      end: match.index + rawText.length,
      token: {
        text: rawText,
        type: 'email',
        linkUrl: `mailto:${rawText}`,
      },
    });
    match = emailRegexCopy.exec(input);
  }

  // 6. Match URLs
  const urlRegexCopy = new RegExp(URL_REGEX);
  match = urlRegexCopy.exec(input);
  while (match != null) {
    const rawText = match[0];
    const href = rawText.startsWith('www.') ? `https://${rawText}` : rawText;
    matches.push({
      start: match.index,
      end: match.index + rawText.length,
      token: {
        text: rawText,
        type: 'url',
        linkUrl: href,
      },
    });
    match = urlRegexCopy.exec(input);
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
    return [{ text: input, type: 'text' }];
  }

  const tokens: TextToken[] = [];
  let currentIndex = 0;

  for (const m of filteredMatches) {
    if (m.start > currentIndex) {
      tokens.push({
        text: input.substring(currentIndex, m.start),
        type: 'text',
      });
    }
    tokens.push(m.token);
    currentIndex = m.end;
  }

  if (currentIndex < input.length) {
    tokens.push({
      text: input.substring(currentIndex),
      type: 'text',
    });
  }

  return tokens;
}
