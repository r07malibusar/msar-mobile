import type { GeoPoint } from '@/utility/w3w';
import React, { useMemo, useState } from 'react';
import { Autolink, PhoneMatchersByCountry } from 'react-native-autolink';
import LocationActionModal from '@/components/modals/LocationActionModal';
import { createGeoMatchers } from '@/utility/geoAutolinkMatchers';

interface GeoLocationTextProps {
  text?: string | null;
  style?: any;
  selectable?: boolean;
}

export default function GeoLocationText({ text, style, selectable = true }: GeoLocationTextProps) {
  const [selectedGeoPoint, setSelectedGeoPoint] = useState<GeoPoint | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handleGeoPress = (geoPoint: GeoPoint) => {
    setSelectedGeoPoint(geoPoint);
    setModalVisible(true);
  };

  const matchers = useMemo(() => {
    const geoMatchers = createGeoMatchers(handleGeoPress);
    // Applying the US phone matcher so generic 10 digit numbers get parsed as phone numbers
    return [...geoMatchers, PhoneMatchersByCountry.US];
  }, []);

  if (!text) {
    return null;
  }

  return (
    <>
      <Autolink
        text={text}
        style={style}
        selectable={selectable}
        email
        phone
        url={{ schemeMatches: true, wwwMatches: true, tldMatches: false }}
        matchers={matchers}
      />

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
