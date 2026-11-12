import { convertTo3WA as nativeConvertTo3WA, convertToCoordinates as nativeConvertToCoordinates } from '@modules/w3w-module';
import { W3W_API_KEY } from '@utility/constants';

export interface GeoPoint {
  rawText: string;
  type: 'w3w' | 'decimal' | 'ddm';
  latitude: number;
  longitude: number;
  w3wWords?: string;
}

function hasValidApiKey(): boolean {
  return typeof W3W_API_KEY === 'string'
    && W3W_API_KEY.length > 0
    && !W3W_API_KEY.includes('YOUR_');
}

/** Convert What3Words 3-word string (e.g. "filled.count.soap", "///filled.count.soap", or "W3w.what.three.words") to coordinates */
export async function convertW3WToCoordinates(words: string): Promise<{ latitude: number; longitude: number; words: string } | null> {
  const cleanWords = words.replace(/^(?:\/\/\/|w3w[./]|w3w:)/i, '').trim().toLowerCase();
  if (!cleanWords) {
    return null;
  }

  // 1. Try local offline native engine first (w3w-data.zip)
  try {
    const res = await nativeConvertToCoordinates(cleanWords);
    if (res?.latitude !== undefined && res?.longitude !== undefined) {
      return {
        latitude: res.latitude,
        longitude: res.longitude,
        words: `///${cleanWords}`,
      };
    }
  }
  catch (e) {
    console.log('[W3W JS] Offline W3W to coordinates failed, trying online API fallback:', e);
  }

  // 2. Online API Fallback if offline engine returned null or failed
  if (hasValidApiKey()) {
    try {
      const url = `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(cleanWords)}&key=${W3W_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.coordinates?.lat !== undefined && data?.coordinates?.lng !== undefined) {
        return {
          latitude: data.coordinates.lat,
          longitude: data.coordinates.lng,
          words: `///${cleanWords}`,
        };
      }
    }
    catch (error) {
      console.log('[W3W JS] Online W3W API fallback error:', error);
    }
  }

  return null;
}

/** Convert latitude and longitude to What3Words 3-word address */
export async function convertCoordinatesToW3W(lat: number, lon: number): Promise<string | null> {
  if (lat === 0 && lon === 0) {
    return null;
  }

  // 1. Try local offline native engine first (w3w-data.zip)
  try {
    const result = await nativeConvertTo3WA(lat, lon);
    if (result) {
      return result.startsWith('///') ? result : `///${result}`;
    }
  }
  catch (e) {
    console.log('[W3W JS] Offline W3W to 3wa failed, trying online API fallback:', e);
  }

  // 2. Online API Fallback if offline engine returned null or failed
  if (hasValidApiKey()) {
    try {
      const url = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lon}&key=${W3W_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.words) {
        return `///${data.words}`;
      }
    }
    catch (error) {
      console.log('[W3W JS] Online W3W API fallback error:', error);
    }
  }

  return null;
}
