import LargeButton from '@components/inputs/LargeButton';
import ModalAnimation from '@components/modals/common/ModalAnimation';
import colors, { textColorForBackground } from '@styles/colors';
import { elements } from '@styles/elements';
import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCalloutResponsesAvailableQuery } from '@/remote/query';

interface ResponsePayload {
  text: string;
  start_time?: string | null;
  end_time?: string | null;
}

interface CalloutRespondModalProps {
  modalVisible: boolean;
  responseTimeMode?: 'promised_time' | 'stated_time' | string;
  myResponse?: string | null;
  onSelect: (payload: ResponsePayload) => void;
  onCancel: () => void;
}

function isOptionAvailable(
  option: any,
  myResponse: string | null | undefined,
  responseTimeMode: string,
): boolean {
  // 1. Check compatibility with the callout's active response_time_mode
  if (option.compatible_response_time_mode) {
    const rawModes = option.compatible_response_time_mode.trim();
    if (rawModes !== '*' && rawModes !== '') {
      const allowedModes = rawModes
        .split(',')
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
      if (!allowedModes.includes(responseTimeMode.toLowerCase())) {
        return false;
      }
    }
  }

  const currentResponse = myResponse ? myResponse.trim().toLowerCase() : null;

  // 2. User has not responded yet
  if (!currentResponse) {
    return option.allow_initial !== false;
  }

  // 3. User has already responded: check if transition from myResponse is allowed
  if (option.allowed_from === undefined) {
    return true;
  }

  if (!option.allowed_from || option.allowed_from.trim() === '') {
    return false;
  }

  if (option.allowed_from.trim() === '*') {
    return true;
  }

  const allowedStates = option.allowed_from
    .split(',')
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);

  return allowedStates.includes(currentResponse);
}

const arrivalOffsets = [
  { label: '+15 min', minutes: 15 },
  { label: '+30 min', minutes: 30 },
  { label: '+45 min', minutes: 45 },
  { label: '+1 hr', minutes: 60 },
];

function CalloutRespondModal({
  modalVisible,
  responseTimeMode = 'promised_time',
  myResponse,
  onSelect,
  onCancel,
}: CalloutRespondModalProps) {
  const isPromisedTimeMode = responseTimeMode === 'promised_time';

  const [pendingLongPressResponse, setPendingLongPressResponse] = useState<string | null>(null);

  const calloutResponesQuery = useCalloutResponsesAvailableQuery();

  const handleResponsePress = (item: {
    value: string;
    isAttending: boolean;
    triggersStartTime: boolean;
    triggersEndTime: boolean;
  }) => {
    const responseText = item.value;
    const now = new Date().toISOString();

    let startTime: string | null = null;
    let endTime: string | null = null;

    if (item.triggersStartTime) {
      startTime = now;
    }
    if (item.triggersEndTime) {
      endTime = now;
    }

    onSelect({
      text: responseText,
      start_time: startTime,
      end_time: endTime,
    });
  };

  const handleResponseLongPress = (item: { value: string; isAttending: boolean }) => {
    if (isPromisedTimeMode && item.isAttending) {
      setPendingLongPressResponse(item.value);
    }
  };

  const handleSelectArrivalOffset = (minutes: number) => {
    if (!pendingLongPressResponse) {
      return;
    }
    const arrivalTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    onSelect({
      text: pendingLongPressResponse,
      start_time: arrivalTime,
      end_time: null,
    });
    setPendingLongPressResponse(null);
  };

  const buttons: any[] = [];
  if (calloutResponesQuery.data) {
    const rawOptions = [...calloutResponesQuery.data.results];

    // Order options ascending by position
    rawOptions.sort((a, b) => (a.position ?? 1) - (b.position ?? 1));

    rawOptions.forEach((data: any) => {
      // Compatibility and state transition check
      if (!isOptionAvailable(data, myResponse, responseTimeMode)) {
        return;
      }

      const backgroundColor: string = data.color ?? colors.white;
      buttons.push({
        title: data.response,
        value: data.response,
        isAttending: data.is_attending ?? false,
        triggersStartTime: data.triggers_start_time ?? false,
        triggersEndTime: data.triggers_end_time ?? false,
        backgroundColor,
        textColor: textColorForBackground(backgroundColor),
      });
    });
  }

  const renderModalContent = () => {
    if (pendingLongPressResponse) {
      return (
        <View style={styles.overlayContent}>
          <Text style={styles.overlayHeader}>Estimated Arrival</Text>
          <Text style={styles.overlaySubtitle}>
            Select estimated travel time for
            {' '}
            {pendingLongPressResponse}
            :
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollerContainer}>
            {arrivalOffsets.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.offsetChip}
                onPress={() => handleSelectArrivalOffset(item.minutes)}
              >
                <Text style={styles.offsetChipText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ height: 16 }} />
          <LargeButton
            title="Cancel"
            backgroundColor={colors.secondaryBg}
            textColor={colors.grayText}
            onPress={() => setPendingLongPressResponse(null)}
          />
        </View>
      );
    }

    return (
      <>
        <Text style={[elements.mediumText, { margin: 8, fontWeight: '500' }]}>
          Respond:
        </Text>

        {isPromisedTimeMode && (
          <Text style={styles.hintText}>
            Tip: Hold long press on responding options to select estimated arrival time.
          </Text>
        )}

        <FlatList
          style={{ borderRadius: 20 }}
          data={buttons}
          keyExtractor={item => item.title}
          renderItem={({ item }) => (
            <LargeButton
              title={item.title}
              backgroundColor={item.backgroundColor}
              textColor={item.textColor}
              onPress={() => handleResponsePress(item)}
              onLongPress={() => handleResponseLongPress(item)}
            />
          )}
          ListFooterComponent={(
            <>
              <View style={{ height: 20 }} />
              <LargeButton
                title="Cancel"
                backgroundColor={colors.secondaryBg}
                textColor={colors.grayText}
                onPress={onCancel}
              />
            </>
          )}
        />
      </>
    );
  };

  return (
    <ModalAnimation modalVisible={modalVisible} tray onCancel={onCancel}>
      <>
        <View style={{ flex: 1 }} />
        <View style={styles.container}>
          {renderModalContent()}
        </View>
      </>
    </ModalAnimation>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderColor: colors.grayText,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.primaryBg,
  },
  hintText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
    marginLeft: 8,
  },
  overlayContent: {
    paddingVertical: 10,
  },
  overlayHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 6,
  },
  overlaySubtitle: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 16,
  },
  scrollerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  offsetChip: {
    backgroundColor: colors.darkBlue,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.secondaryYellow,
  },
  offsetChipText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondaryYellow,
  },
});

export default CalloutRespondModal;
