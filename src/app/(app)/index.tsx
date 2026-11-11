import type { IconName } from '@/utility/icon';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import colors from '@styles/colors';
import { elements, getFontScale } from '@styles/elements';
import Badge from 'components/Badge';
import SnoozeModal from 'components/modals/SnoozeModal';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSnoozeExpires, storeSnoozeExpires, useLastRead } from 'storage/mmkv';
import { activeTabStatusQuery } from 'types/calloutSummary';
import { logEntriesFromInfiniteQueryData } from 'types/logEntry';
import useAuth from '@/hooks/useAuth';
import { useCalloutListQuery, useChatLogInfiniteQuery } from '@/remote/query';
import { getTimeString } from '@/utility/dateHelper';

// Warning: this limits at PAGE_SIZE. We should never have that many active.
function useNumberActiveCallouts(): number {
  // Use the active&resolved query because it acts like a prefetch.
  const query = useCalloutListQuery(activeTabStatusQuery);
  if (query.data) {
    return query.data.filter(x => x.status === 'active').length;
  }
  return 0;
}

function useChatUnread(): boolean {
  const { data } = useChatLogInfiniteQuery();
  const logList = logEntriesFromInfiniteQueryData(data);
  const lastId = logList ? Number.parseInt(logList[0]?.id) : 0;
  const [lastLogRead, _setLastLogRead] = useLastRead(0);
  const hasUnread = (lastLogRead === undefined) || (lastLogRead < lastId);
  return hasUnread;
}

const dateDisplayMs = 23 * 60 * 60 * 1000; // Show date until 23 hours prior.
function getSnoozeTitle(snoozeExpireTime: number): string {
  const snoozeRemaining = snoozeExpireTime - new Date().getTime();
  if (snoozeRemaining > dateDisplayMs) {
    return `Snoozing until ${new Date(snoozeExpireTime).toLocaleString()}`;
  }
  else if (snoozeRemaining > 0) {
    return `Snoozing until ${new Date(snoozeExpireTime).toLocaleTimeString()}`;
  }
  return 'Snooze';
}

interface Items {
  text: string;
  icon?: IconName;
  key?: string;
  url?: string;
  onPress?: () => unknown;
  badge?: string | number;
}

function Page() {
  const [snoozeModalVisible, setSnoozeModalVisible] = useState(false);
  const [snoozeDatePickerVisible, setSnoozeDatePickerVisible] = useState(false);
  const [snoozeExpireTime, setSnoozeExpireTime] = useState(() => getSnoozeExpires());

  const chatHasUnread = useChatUnread();
  const numberActiveCallouts = useNumberActiveCallouts();
  const { api } = useAuth();
  const fontScale = getFontScale();
  const snoozeTitle = getSnoozeTitle(snoozeExpireTime);
  console.log('index', numberActiveCallouts);

  const iconSize = 30 * fontScale;
  const items: Items[] = [
    { text: 'Callouts', icon: 'car-emergency', url: '/callout-list', badge: numberActiveCallouts },
    { text: 'Messages', icon: 'forum-outline', url: '/chat', badge: chatHasUnread ? '!' : undefined },
    { text: 'You are Here', icon: 'crosshairs-gps', url: '/you-are-here' },
    { text: 'Roster', icon: 'account-multiple-outline', url: '/roster' },
    { text: 'Certs', icon: 'certificate', url: '/certs' },
    { text: 'Calendar', icon: 'calendar', url: '/calendar' },
    { text: 'Settings', icon: 'cog', url: '/settings' },
    { text: snoozeTitle, icon: 'alarm-snooze', key: 'snooze', onPress: () => setSnoozeModalVisible(true) },
  ];
  console.log('fontScale', fontScale, getFontScale());

  if (Platform.OS === 'ios') {
    StatusBar.setBarStyle('dark-content');
  }
  else if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor(colors.primaryBg);
    StatusBar.setBarStyle('light-content');
  }

  useEffect(() => {
    const getSnoozeUpdateTimeout = () => {
      let snoozeRemaining = snoozeExpireTime - new Date().getTime();
      if (snoozeRemaining > dateDisplayMs) {
        snoozeRemaining -= dateDisplayMs; // Update text when 23h remains
      }
      console.log('getSnoozeUpdateInterval', snoozeRemaining);
      return snoozeRemaining;
    };

    const timeout = setTimeout(
      () => {
        setSnoozeExpireTime(() => getSnoozeExpires() - 1);
        console.log(snoozeExpireTime, getSnoozeExpires());
      },
      getSnoozeUpdateTimeout(),
    );
    return () => clearTimeout(timeout);
  }, [snoozeExpireTime]);

  const updateSnoozeExpireTime = (ms: number) => {
    storeSnoozeExpires(ms);
    setSnoozeExpireTime(ms);
  };

  const snoozeSelected = (minutes: number) => {
    console.log('snoozeSelected', minutes);
    setSnoozeModalVisible(false);
    if (!minutes) {
      updateSnoozeExpireTime(0);
      return;
    }
    if (minutes < 0) {
      setSnoozeDatePickerVisible(true);
      return;
    }
    const minutesToMs = 60 * 1000;
    const currentTime = new Date().getTime();
    const expireTime = currentTime + minutes * minutesToMs;
    const expireDate = new Date(expireTime);
    updateSnoozeExpireTime(expireTime);
    console.log(expireTime, expireDate.toLocaleTimeString());
  };

  return (
    <>
      <Image source={require('@assets/background.png')} style={styles.backgroundImage} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Image source={api.logo()} style={styles.logoImage} />
          <View style={styles.buttonSectionContainer}>
            {items.map(item => (
              <TouchableOpacity
                activeOpacity={0.5}
                onPress={item.onPress
                  ? item.onPress
                  : () => {
                      if (item.url) {
                        router.push(item.url);
                      }
                    }}
                testID={item.text}
                key={item.text}
                style={[{
                  flexBasis: 'auto',
                  width: fontScale > 1.5 ? '100%' : '50%',
                }]}
              >
                <View style={[elements.tray, styles.contentTray]}>
                  {item.icon && <View style={styles.buttonIcon}><MaterialCommunityIcons name={item.icon} size={iconSize} color="white" /></View>}
                  <Text style={styles.buttonText}>{item.text}</Text>
                  {!!item.badge && <Badge style={styles.badge}>{item.badge}</Badge>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <SnoozeModal
        modalVisible={snoozeModalVisible}
        onSelect={snoozeSelected}
        onCancel={() => setSnoozeModalVisible(false)}
      />
      <DateTimePickerModal
        isVisible={snoozeDatePickerVisible}
        mode="datetime"
        date={new Date()}
        onConfirm={(date) => {
          console.log('DateTimePickerModal', getTimeString(date));
          setSnoozeDatePickerVisible(false);
          updateSnoozeExpireTime(date.getTime());
        }}
        onCancel={() => setSnoozeDatePickerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -5,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    backgroundColor: colors.clear,
  },
  buttonSectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  contentTray: {
    flex: 1,
    flexDirection: 'column',
    marginHorizontal: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    paddingTop: 8, // bottom padding handled by text below
    paddingHorizontal: 8,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.primaryText,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  scrollView: {
    marginTop: 0,
    flex: 1,
    paddingTop: 10,
  },
  logoImage: {
    margin: 20,
    alignSelf: 'center',
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  badge: {
    position: 'absolute',
    right: 7,
    top: 7,
  },
});

export default Page;
