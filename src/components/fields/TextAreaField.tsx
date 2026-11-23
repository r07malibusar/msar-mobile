import colors from '@styles/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GeoLocationText from '@/components/fields/GeoLocationText';

interface TextAreaFieldProps {
  title?: string;
  value: string;
  valueColor?: string;
}

function TextAreaField({ title, value, valueColor }: TextAreaFieldProps) {
  const textColor = valueColor || colors.primaryText;

  return (
    <View style={styles.container}>
      {!!title
        && <Text style={styles.titleText}>{title}</Text>}
      <View style={styles.valueContainer}>
        <GeoLocationText
          text={value}
          style={[styles.valueText, { color: textColor }]}
          selectable
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '300',
    color: colors.lightText,
    marginBottom: 8,
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.primaryText,
  },
});

export default TextAreaField;
