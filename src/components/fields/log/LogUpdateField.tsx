import type { user } from '@/types/user';
import colors from '@styles/colors';
import { elements } from '@styles/elements';
import { getConditionalTimeString } from '@utility/dateHelper';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GeoLocationText from '@/components/fields/GeoLocationText';
import { userToString } from '@/types/user';

interface LogSystemFieldProps {
  member: user;
  update: string;
  timestamp: Date;
}

function LogSystemField({ member, update, timestamp }: LogSystemFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.valueText, { color: colors.grayText }]}>
        {userToString(member)}
      </Text>
      <GeoLocationText
        text={update}
        style={[elements.fieldText, { textAlign: 'center' }]}
        selectable
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

export default LogSystemField;
