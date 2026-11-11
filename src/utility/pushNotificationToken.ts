import type { Api } from '@/remote/api';
import messaging from '@react-native-firebase/messaging';

async function getPushToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  }
  catch (error) {
    // dev mode fallback
    console.warn('Firebase Messaging token error:', error);
    return null;
  }
}

export async function updatePushToken(api: Api) {
  const token = await getPushToken();
  if (token) {
    console.log('registered', token);
    api.apiUpdateDeviceId(token);
  }
}

export async function sendPushToken(api: Api, active: boolean = true) {
  const token = await getPushToken();
  if (token) {
    await api.apiSetDeviceId(token, active);
  }
}

export async function checkPushToken(api: Api): Promise<boolean> {
  try {
    const token = await getPushToken();
    if (!token) {
      return false;
    }
    return await api.apiIsDeviceIdActive(token);
  }
  catch (error) {
    console.warn('Check push token error:', error);
    return false;
  }
}

export async function removePushToken(api: Api) {
  try {
    const token = await getPushToken();
    if (token != null) {
      return await api.apiRemoveDeviceId(token);
    }
  }
  catch (error) {
    console.warn('Remove push token error:', error);
  }
}
