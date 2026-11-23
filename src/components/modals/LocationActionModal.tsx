import type { GeoPoint } from '@/utility/w3w';
import React from 'react';
import LocationDetailsView from '@/components/location/LocationDetailsView';
import ModalFade from '@/components/modals/common/ModalFade';

interface LocationActionModalProps {
  modalVisible: boolean;
  geoPoint: GeoPoint | null;
  onCancel: () => void;
}

export default function LocationActionModal({
  modalVisible,
  geoPoint,
  onCancel,
}: LocationActionModalProps) {
  if (!modalVisible || !geoPoint) {
    return null;
  }

  return (
    <ModalFade
      modalVisible={modalVisible}
      onCancel={onCancel}
      headerTitle="Location Details"
    >
      <LocationDetailsView
        geoPoint={geoPoint}
        onClose={onCancel}
        closeButtonText="Close"
      />
    </ModalFade>
  );
}
