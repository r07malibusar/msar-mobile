import type { GeoPoint } from '@/utility/w3w';
import Header from '@components/Header';
import colors from '@styles/colors';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-root-toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationDetailsView from '@/components/location/LocationDetailsView';

export default function YouAreHereScreen() {
  const [geoPoint, setGeoPoint] = useState<GeoPoint | null>(null);

  useEffect(() => {
    let isMounted = true;

    const acquireLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Toast.show('Location permission denied', { duration: Toast.durations.SHORT });
          return;
        }
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        }
        if (loc && isMounted) {
          setGeoPoint({
            rawText: `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`,
            type: 'decimal',
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
        else if (isMounted) {
          Toast.show('Unable to acquire current location', { duration: Toast.durations.SHORT });
        }
      }
      catch (error) {
        console.log('Location error:', error);
        if (isMounted) {
          Toast.show('Unable to acquire current location', { duration: Toast.durations.SHORT });
        }
      }
    };

    acquireLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="You are Here" backButton />
      <LocationDetailsView
        geoPoint={geoPoint}
        onClose={() => router.back()}
        closeButtonText="Back"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBg,
  },
});
