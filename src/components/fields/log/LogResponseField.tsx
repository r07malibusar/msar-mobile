import type { user } from '@/types/user';
import colors from '@styles/colors';
import { getConditionalTimeString, getTimeString } from '@utility/dateHelper';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GeoLocationText from '@/components/fields/GeoLocationText';
import { useCalloutResponsesAvailableMap } from '@/remote/query';
import { colorForResponseType } from '@/types/calloutSummary';
import { userToString } from '@/types/user';

interface LogResponseFieldProps {
  member: user;
  response: string;
  timestamp: Date;
  startTime?: Date;
  endTime?: Date;
}

function LogResponseField({ member, response, timestamp, startTime, endTime }: LogResponseFieldProps) {
  const calloutResponseMap = useCalloutResponsesAvailableMap();

  let extraTimeStr = '';
  if (startTime) {
    extraTimeStr = ` (Arrival: ${getTimeString(startTime)})`;
  }
  else if (endTime) {
    extraTimeStr = ` (End Time: ${getTimeString(endTime)})`;
  }

  const fullText = `${userToString(member)} responded ${response}${extraTimeStr}`;

  return (
    <View style={styles.container}>
      <GeoLocationText
        text={fullText}
        style={[styles.valueText, { color: colorForResponseType(response, calloutResponseMap) }]}
      />
      <Text style={styles.logTimestamp}>
        {getConditionalTimeString(timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 8,
  },
  valueText: {
    fontSize: 18,
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'center',
    color: colors.primaryText,
  },
  logTimestamp: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    color: colors.grayText,
  },
});

export default LogResponseField;
