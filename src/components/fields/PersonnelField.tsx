import type { opResponse } from '@/types/operationalPeriod';
import colors from '@styles/colors';
import { datePortionEqual, getPaddedDateString, getTimeString } from '@utility/dateHelper';
import { makePhoneCall } from '@utility/phone';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCalloutResponsesAvailableMap } from '@/remote/query';
import { userToString } from '@/types/user';

interface PersonnelFieldProps {
  opResponse: opResponse;
  responseTimeMode?: string;
}

function formatDateTime(date: Date, includeDate: boolean = true): string {
  if (includeDate) {
    return `${getPaddedDateString(date, false)} ${getTimeString(date)}`;
  }
  return getTimeString(date);
}

function formatRange(start: Date, end: Date, includeDate: boolean = true): string {
  if (includeDate) {
    if (datePortionEqual(start, end)) {
      return `${getPaddedDateString(start, false)} ${getTimeString(start)} - ${getTimeString(end)}`;
    }
    return `${getPaddedDateString(start, false)} ${getTimeString(start)} - ${getPaddedDateString(end, false)} ${getTimeString(end)}`;
  }
  return `${getTimeString(start)} - ${getTimeString(end)}`;
}

function PersonnelField({ opResponse, responseTimeMode = 'promised_time' }: PersonnelFieldProps) {
  const calloutResponsesAvailableMap = useCalloutResponsesAvailableMap();

  const responseObj = calloutResponsesAvailableMap?.get(opResponse.response);
  const isAttending = responseObj ? responseObj.is_attending : true;

  const startTime = opResponse.start_time;
  const endTime = opResponse.end_time || opResponse.signed_out_at;

  let badgeText: string | null = null;

  if (responseTimeMode === 'stated_time') {
    if (startTime && endTime) {
      badgeText = `Arrival: ${formatRange(startTime, endTime, true)}`;
    }
    else if (startTime) {
      badgeText = `Arrival: ${formatDateTime(startTime, true)}`;
    }
    else if (endTime) {
      badgeText = `End Time: ${formatDateTime(endTime, true)}`;
    }
  }
  else {
    // promised_time mode
    if (endTime) {
      if (startTime) {
        badgeText = `Arrival: ${formatRange(startTime, endTime, false)}`;
      }
      else {
        badgeText = `End Time: ${formatDateTime(endTime, false)}`;
      }
    }
    else if (isAttending && startTime) {
      badgeText = `Est. Arrival: ${formatDateTime(startTime, false)}`;
    }
  }

  return (
    <View style={styles.container}>
      {!!opResponse.member.mobile_phone && (
        <TouchableOpacity style={styles.button} activeOpacity={0.5} onPress={() => makePhoneCall(opResponse.member.mobile_phone)}>
          <View style={styles.textColumn}>
            <Text style={styles.valueText}>{userToString(opResponse.member)}</Text>
            {!!badgeText && <Text style={styles.timeBadgeText}>{badgeText}</Text>}
          </View>
          <Image source={require('@assets/icons/phone.png')} style={styles.iconImage} />
        </TouchableOpacity>
      )}
      {!opResponse.member.mobile_phone && (
        <View style={styles.textColumn}>
          <Text style={[styles.valueText, { color: colors.primaryText }]}>{userToString(opResponse.member)}</Text>
          {!!badgeText && <Text style={styles.timeBadgeText}>{badgeText}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.primaryText,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondaryYellow,
    marginTop: 2,
  },
  iconImage: {
    resizeMode: 'contain',
    width: 30,
    height: 30,
  },
});

export default PersonnelField;
