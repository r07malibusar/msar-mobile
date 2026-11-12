import type { GeoPoint } from '@/utility/w3w';
import colors from '@styles/colors';
import React, { useState } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
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

  const handleLinkPress = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch((err) => {
        console.log('Error opening link:', err);
      });
    }
  };

  return (
    <>
      <Text style={style} selectable={selectable}>
        {tokens.map((token, index) => {
          const tokenKey = `token-${token.type}-${index}-${token.text}`;

          if ((token.type === 'w3w' || token.type === 'decimal' || token.type === 'ddm') && token.geoPoint) {
            return (
              <Text
                key={tokenKey}
                style={styles.geoLink}
                onPress={() => handleGeoPress(token.geoPoint)}
              >
                {token.text}
              </Text>
            );
          }

          if ((token.type === 'phone' || token.type === 'email' || token.type === 'url') && token.linkUrl) {
            return (
              <Text
                key={tokenKey}
                style={styles.standardLink}
                onPress={() => handleLinkPress(token.linkUrl)}
              >
                {token.text}
              </Text>
            );
          }

          return (
            <Text key={tokenKey}>
              {token.text}
            </Text>
          );
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
  standardLink: {
    color: colors.selectionBg,
    textDecorationLine: 'underline',
  },
});
