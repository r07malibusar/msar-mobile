import { convertTo3WA as nativeConvertTo3WA, convertToCoordinates as nativeConvertToCoordinates } from '@modules/w3w-module';

export interface GeoPoint {
  rawText: string;
  type: 'w3w' | 'decimal' | 'ddm';
  latitude: number;
  longitude: number;
  w3wWords?: string;
}

/** Convert What3Words 3-word string (e.g. "filled.count.soap" or "///filled.count.soap") to coordinates using offline engine */
export async function convertW3WToCoordinates(words: string): Promise<{ latitude: number; longitude: number; words: string } | null> {
  const cleanWords = words.replace(/^\/\/\//, '').trim();
  if (!cleanWords) {
    return null;
  }

  console.log('[W3W JS] convertW3WToCoordinates called:', cleanWords);

  try {
    const res = await nativeConvertToCoordinates(cleanWords);
    console.log('[W3W JS] nativeConvertToCoordinates result:', res);
    if (res?.latitude !== undefined && res?.longitude !== undefined) {
      return {
        latitude: res.latitude,
        longitude: res.longitude,
        words: `///${cleanWords}`,
      };
    }
  }
  catch (e) {
    console.log('[W3W JS] Offline W3W to coordinates error:', e);
  }

  return null;
}

/** Convert latitude and longitude to What3Words 3-word address using offline engine */
export async function convertCoordinatesToW3W(lat: number, lon: number): Promise<string | null> {
  console.log('[W3W JS] convertCoordinatesToW3W called: lat=', lat, 'lon=', lon);

  try {
    const result = await nativeConvertTo3WA(lat, lon);
    console.log('[W3W JS] nativeConvertTo3WA result:', result);
    if (result) {
      return result.startsWith('///') ? result : `///${result}`;
    }
  }
  catch (e) {
    console.log('[W3W JS] Offline W3W to 3wa error:', e);
  }

  return null;
}
