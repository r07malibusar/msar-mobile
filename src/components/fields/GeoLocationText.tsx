import type { GeoPoint } from '@/utility/w3w';
import colors from '@styles/colors';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import LocationActionModal from '@/components/modals/LocationActionModal';
import { parseGeoPoints } from '@/utility/geoTextParser';

interface GeoLocationTextProps {
  text?: string | null;
  style?: any;
  selectable?: boolean;
}

export default function GeoLocationText({ text, style, selectable = true }: GeoLocationTextProps) {
  const [selectedGeoPoint, setSelectedGeoPoint] = useState<GeoPoint | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  if (!text) {
    return null;
  }

  const tokens = parseGeoPoints(text);

  const handleGeoPress = (geoPoint?: GeoPoint) => {
    if (geoPoint) {
      setSelectedGeoPoint(geoPoint);
      setModalVisible(true);
    }
  };

  return (
    <>
      <Text style={style} selectable={selectable}>
        {tokens.map((token) => {
          if (token.isGeoPoint && token.geoPoint) {
            return (
              <Text
                key={`geo-link-${token.text}-${token.geoPoint.type}-${token.geoPoint.rawText}`}
                style={styles.geoLink}
                onPress={() => handleGeoPress(token.geoPoint)}
              >
                {token.text}
              </Text>
            );
          }
          return token.text;
        })}
      </Text>

      {modalVisible && selectedGeoPoint && (
        <LocationActionModal
          modalVisible={modalVisible}
          geoPoint={selectedGeoPoint}
          onCancel={() => {
            setModalVisible(false);
            setSelectedGeoPoint(null);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  geoLink: {
    color: colors.secondaryYellow,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
