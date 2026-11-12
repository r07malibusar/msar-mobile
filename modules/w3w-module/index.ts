import * as Sentry from '@sentry/react-native';
import { requireNativeModule } from 'expo-modules-core';
import Toast from 'react-native-root-toast';

let NativeW3WModule: any = null;
try {
  NativeW3WModule = requireNativeModule('W3WModule');
}
catch (e) {
  console.warn('[W3W Module] Native W3WModule not linked:', e);
}

export async function convertTo3WA(lat: number, lon: number): Promise<string | null> {
  if (!NativeW3WModule?.convertTo3WA) {
    return null;
  }
  try {
    return await NativeW3WModule.convertTo3WA(lat, lon);
  }
  catch (e: any) {
    console.error('[W3W Module] convertTo3WA error:', e);
    Sentry.captureException(e);
    Toast.show(`What3Words error: ${e.message || 'offline conversion failed'}`, { duration: Toast.durations.SHORT });
    return null;
  }
}

export async function convertToCoordinates(words: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!NativeW3WModule?.convertToCoordinates) {
    return null;
  }
  try {
    return await NativeW3WModule.convertToCoordinates(words);
  }
  catch (e: any) {
    console.error('[W3W Module] convertToCoordinates error:', e);
    Sentry.captureException(e);
    Toast.show(`What3Words error: ${e.message || 'offline conversion failed'}`, { duration: Toast.durations.SHORT });
    return null;
  }
}
