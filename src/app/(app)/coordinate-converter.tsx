import type { GeoPoint } from '@/utility/w3w';
import Header from '@components/Header';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import colors from '@styles/colors';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-root-toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationDetailsView from '@/components/location/LocationDetailsView';
import { parseGeoPoints } from '@/utility/geoTextParser';
import { convertCoordinatesToW3W, convertW3WToCoordinates } from '@/utility/w3w';

export default function CoordinateConverterScreen() {
  const [inputText, setInputText] = useState<string>('');
  const [geoPoint, setGeoPoint] = useState<GeoPoint | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [isInitialLocation, setIsInitialLocation] = useState<boolean>(true);

  const handleUseCurrentLocation = async () => {
    setIsInitialLocation(true);
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show('Location permission denied', { duration: Toast.durations.SHORT });
        setLoadingLocation(false);
        return;
      }
      let loc = await Location.getLastKnownPositionAsync();
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      }
      if (loc) {
        const currentLat = loc.coords.latitude;
        const currentLon = loc.coords.longitude;
        const locStr = `${currentLat.toFixed(6)}, ${currentLon.toFixed(6)}`;
        setInputText(locStr);
        setGeoPoint({
          rawText: locStr,
          type: 'decimal',
          latitude: currentLat,
          longitude: currentLon,
        });
      }
      else {
        Toast.show('Unable to acquire current location', { duration: Toast.durations.SHORT });
      }
    }
    catch (error) {
      console.log('Location error:', error);
      Toast.show('Unable to acquire current location', { duration: Toast.durations.SHORT });
    }
    finally {
      setLoadingLocation(false);
    }
  };

  // Default screen to current location on load
  useEffect(() => {
    handleUseCurrentLocation();
  }, []);

  const handleInputFocus = () => {
    // clear the field of the current coords on the first focus
    if (isInitialLocation) {
      setInputText('');
      setIsInitialLocation(false);
    }
  };

  const handleConvertSubmit = async () => {
    if (!inputText.trim()) {
      Toast.show('Please enter coordinates or a What3Words address', { duration: Toast.durations.SHORT });
      return;
    }

    const tokens = parseGeoPoints(inputText);
    const firstGeoToken = tokens.find(t => t.isGeoPoint && t.geoPoint);

    if (firstGeoToken?.geoPoint) {
      const point = { ...firstGeoToken.geoPoint };

      // If What3Words -> resolve lat/lon
      if (point.type === 'w3w' && (!point.latitude || !point.longitude)) {
        const coords = await convertW3WToCoordinates(point.rawText);
        if (coords) {
          point.latitude = coords.latitude;
          point.longitude = coords.longitude;
          point.w3wWords = coords.words;
        }
      }
      // If GPS -> resolve What3Words address if missing
      else if (!point.w3wWords && point.latitude !== 0 && point.longitude !== 0) {
        const words = await convertCoordinatesToW3W(point.latitude, point.longitude);
        if (words) {
          point.w3wWords = words;
        }
      }

      setGeoPoint(point);
    }
    else {
      Toast.show('Invalid coordinates or What3Words address', { duration: Toast.durations.SHORT });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Coordinate Converter" backButton />
      <View style={styles.content}>
        {/* Text Input Row with Convert Button */}
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.grayText} style={styles.searchIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter W3W or GPS coords..."
              placeholderTextColor={colors.grayText}
              value={inputText}
              onChangeText={setInputText}
              onFocus={handleInputFocus}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleConvertSubmit}
              clearButtonMode="while-editing"
            />
          </View>

          <TouchableOpacity
            style={styles.convertButton}
            onPress={handleConvertSubmit}
          >
            <Text style={styles.convertButtonText}>Convert</Text>
          </TouchableOpacity>
        </View>

        {/* Use Current Location Button */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleUseCurrentLocation}
          disabled={loadingLocation}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#FFFFFF" />
          <Text style={styles.locationButtonText}>
            {loadingLocation ? 'Acquiring Location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        {/* Location Cards & Actions */}
        <LocationDetailsView
          geoPoint={geoPoint}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBg,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    height: 44,
    color: colors.primaryText,
    fontSize: 14,
  },
  convertButton: {
    backgroundColor: colors.secondaryYellow,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convertButtonText: {
    color: colors.primaryBg,
    fontWeight: 'bold',
    fontSize: 14,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#366087',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});
