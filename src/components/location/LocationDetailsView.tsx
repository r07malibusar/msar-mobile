import type { GeoPoint } from '@/utility/w3w';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import colors from '@styles/colors';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-root-toast';
import { reverseGeocodeCoordinates } from '@/remote/google-maps';
import { formatDDM, formatDecimal, openCalTopo, openMapsApp } from '@/utility/geoHelpers';
import { convertCoordinatesToW3W, convertW3WToCoordinates } from '@/utility/w3w';

interface LocationDetailsViewProps {
  geoPoint: GeoPoint | null;
  onClose?: () => void;
  closeButtonText?: string;
}

export default function LocationDetailsView({
  geoPoint,
  onClose,
  closeButtonText = 'Close',
}: LocationDetailsViewProps) {
  const [lat, setLat] = useState<number>(geoPoint?.latitude ?? 0);
  const [lon, setLon] = useState<number>(geoPoint?.longitude ?? 0);
  const [w3w, setW3w] = useState<string>(geoPoint?.w3wWords ?? '');
  const [placeInfo, setPlaceInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!geoPoint) {
      return;
    }

    let isMounted = true;

    const initializeData = async () => {
      let currentLat = geoPoint.latitude;
      let currentLon = geoPoint.longitude;
      let currentW3W = geoPoint.w3wWords || '';

      if (isMounted) {
        setLoading(true);
        setPlaceInfo(null);
      }

      // If clicked What3Words link -> convert to coordinates
      if (geoPoint.type === 'w3w' && (!currentLat || !currentLon)) {
        const coords = await convertW3WToCoordinates(geoPoint.rawText);
        if (coords) {
          currentLat = coords.latitude;
          currentLon = coords.longitude;
          currentW3W = coords.words;
        }
      }

      // If clicked GPS link -> convert to What3Words address if missing
      if (!currentW3W && currentLat !== 0 && currentLon !== 0) {
        const words = await convertCoordinatesToW3W(currentLat, currentLon);
        if (words) {
          currentW3W = words;
        }
      }

      if (isMounted) {
        setLat(currentLat);
        setLon(currentLon);
        setW3w(currentW3W || '///(offline w3w-data engine)');
      }

      // Reverse geocode place details
      if (currentLat !== 0 || currentLon !== 0) {
        const address = await reverseGeocodeCoordinates(currentLat, currentLon);
        if (isMounted) {
          setPlaceInfo(address);
          setLoading(false);
        }
      }
      else if (isMounted) {
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [geoPoint]);

  if (!geoPoint) {
    return null;
  }

  const decimalText = formatDecimal(lat, lon);
  const ddmText = formatDDM(lat, lon);
  const w3wPrefix = '///';

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show(`${label} copied to clipboard!`, {
      duration: Toast.durations.SHORT,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* What3Words Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.w3wIcon}>{w3wPrefix}</Text>
            <Text style={styles.cardTitle}>What3Words</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(w3w, 'What3Words')}
          >
            <MaterialCommunityIcons name="content-copy" size={16} color={colors.primaryText} />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardValue} selectable>
          {loading && !w3w ? 'Locating...' : (w3w || '///...')}
        </Text>
      </View>

      {/* GPS Decimal Degrees Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.secondaryYellow} />
            <Text style={styles.cardTitle}>GPS Decimal Degrees</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(decimalText, 'Decimal GPS')}
          >
            <MaterialCommunityIcons name="content-copy" size={16} color={colors.primaryText} />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardValue} selectable>
          {loading && lat === 0 ? 'Locating...' : decimalText}
        </Text>
      </View>

      {/* GPS Degrees Decimal Minutes (DDM) Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="compass-outline" size={20} color={colors.secondaryYellow} />
            <Text style={styles.cardTitle}>Degrees Decimal Minutes (DDM)</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(ddmText, 'DDM GPS')}
          >
            <MaterialCommunityIcons name="content-copy" size={16} color={colors.primaryText} />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardValue} selectable>
          {loading && lat === 0 ? 'Locating...' : ddmText}
        </Text>
      </View>

      {/* Textual Place Information Box */}
      <View style={styles.infoCard}>
        <View style={styles.cardTitleRow}>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.secondaryYellow} />
          <Text style={styles.infoTitle}>Nearest Address/Place Name</Text>
        </View>
        <Text style={styles.infoText}>
          {loading ? 'Acquiring location details...' : (placeInfo || 'Place details unavailable')}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.mapButton]}
          onPress={() => openMapsApp(lat, lon, w3w || 'Location')}
        >
          <MaterialCommunityIcons name="google-maps" size={22} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Route in Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.caltopoButton]}
          onPress={() => openCalTopo(lat, lon)}
        >
          <MaterialCommunityIcons name="map-search-outline" size={22} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Launch CalTopo</Text>
        </TouchableOpacity>
      </View>

      {onClose && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>{closeButtonText}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBg,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  w3wIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondaryYellow,
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondaryYellow,
  },
  infoCard: {
    backgroundColor: 'rgba(237, 199, 103, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(237, 199, 103, 0.3)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondaryYellow,
    marginLeft: 6,
  },
  infoText: {
    fontSize: 14,
    color: colors.primaryText,
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    paddingVertical: 14,
    borderRadius: 10,
  },
  mapButton: {
    backgroundColor: '#366087',
  },
  caltopoButton: {
    backgroundColor: '#2E7D32',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.secondaryBg,
    alignItems: 'center',
    marginBottom: 30,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grayText,
  },
});
