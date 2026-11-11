import type { calloutResponse } from '@/types/calloutResponse';
import type { tabItem } from '@/types/tabItem';
import CalloutInformationTab from '@components/callouts/CalloutInformationTab';
import CalloutLogTab from '@components/callouts/CalloutLogTab';
import CalloutPersonnelTab from '@components/callouts/CalloutPersonnelTab';
import LogInput from '@components/callouts/LogInput';
import Header from '@components/Header';
import CalloutRespondModal from '@components/modals/CalloutRespondModal';
import TabSelector from '@components/TabSelector/TabSelector';
import * as Sentry from '@sentry/react-native';
import colors from '@styles/colors';
import { elements } from '@styles/elements';
import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';
import msarEventEmitter from '@utility/msarEventEmitter';
import CalloutFileTab from 'components/callouts/CalloutFileTab';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-root-toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAvoidingCustomView from '@/components/KeyboardAvoidingCustomView';
import useAuth from '@/hooks/useAuth';
import { useCalloutLogMutation } from '@/remote/mutation';
import { calloutLogQueryKey, calloutQueryKey, useCalloutLogInfiniteQuery, useCalloutQuery, useCalloutResponsesAvailableMap, useOperationTypesAvailableQuery } from '@/remote/query';
import { calloutResponseBadge } from '@/types/callout';
import { calloutStatus } from '@/types/enums';
import { calloutResponseSuccessNotification } from '@/utility/pushNotifications';

enum CalloutTabs { INFO, LOG, PERSONNEL, FILES };

function badgeString(badge?: number) {
  if (badge) {
    return `${badge}`;
  }
  return undefined;
}

function Page() {
  const { id, title, type } = useLocalSearchParams<{ id: string; title: string; type?: string }>();
  const { api } = useAuth();
  const calloutResponseMap = useCalloutResponsesAvailableMap();
  const scrollViewRef = useRef(null);

  const [modalVisible, setModalVisible] = useState(false);
  let defaultTab: number = CalloutTabs.INFO;
  if (type != null) {
    if (type === 'log') {
      defaultTab = CalloutTabs.LOG;
    }
  }
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [logMessageText, setLogMessageText] = useState('');

  const idInt: number = Number.parseInt(id);

  const queryClient = useQueryClient();
  const calloutQuery = useCalloutQuery(id);

  const calloutResponseKey = ['calloutResponse', idInt];
  const calloutResponseMutation = useMutation({
    mutationFn: (variables: calloutResponse) =>
      api.apiRespondToCallout(variables.idInt, variables.text, variables.start_time, variables.end_time),
    mutationKey: calloutResponseKey,
    onSuccess: (_result, variables, _context) => {
      msarEventEmitter.emit('refreshCallout', { id: idInt });
      calloutResponseSuccessNotification(variables.text);
    },
    onError: (error, _variables, _context) => {
      Sentry.captureException(error);
      Toast.show(`Unable to set status: ${error.message}`, {
        duration: Toast.durations.LONG,
      });
    },
    retry: 26, // 10 minutes (6 in first minute, then 30s each)
  });
  const calloutResponseMutationState = useMutationState({
    // this mutation key needs to match the mutation key of the given mutation (see above)
    filters: { mutationKey: calloutResponseKey, status: 'pending' },
    select: mutation => mutation.state.variables as calloutResponse,
  });

  const calloutLogMutation = useCalloutLogMutation(idInt);
  const operationTypesAvailableQuery = useOperationTypesAvailableQuery();

  const callout = calloutQuery.data;
  const currentOpType = operationTypesAvailableQuery.data?.results?.find(
    (o: any) => o.name?.toLowerCase() === callout?.operation_type?.toLowerCase(),
  );
  const responseTimeMode = currentOpType?.response_time_mode ?? 'promised_time';

  const headerTitle = callout ? callout.title : title;
  const logBadge = badgeString(callout?.log_count);
  const fileBadge = badgeString(callout?.files?.length);
  const personnelBadge = calloutResponseBadge(callout, calloutResponseMap);
  const calloutTimestamp = callout?.created_at;
  const isActive = callout?.status === calloutStatus.ACTIVE;
  const isResolved = callout?.status === calloutStatus.RESOLVED;
  const headerBackground = isResolved ? colors.green : colors.primaryBg;

  console.log('view-callout modalVisible =', modalVisible);

  const respondButtonText = (calloutResponseMutationState.length
    ? (`Sending response ${calloutResponseMutationState[0].text}`)
    : (callout && callout.my_response ? `Responded ${callout.my_response}` : 'Respond'));

  const tabs: Array<tabItem> = Array.from({ length: 4 });
  tabs[CalloutTabs.INFO] = {
    title: 'Info',
  };
  tabs[CalloutTabs.LOG] = {
    title: 'Log',
    badge: logBadge,
    badgeColor: colors.red,
  };
  tabs[CalloutTabs.FILES] = {
    title: 'Files',
    badge: fileBadge,
    badgeColor: colors.red,
  };
  tabs[CalloutTabs.PERSONNEL] = {
    title: 'Response',
    badge: personnelBadge,
    badgeColor: colors.green,
  };

  useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('light-content');
    }
    else if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(headerBackground);
    }
    return () => {
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(colors.primaryBg);
      }
    };
  }, [headerBackground]);

  useEffect(() => {
    msarEventEmitter.on('refreshCallout', refreshReceived);

    return () => {
      msarEventEmitter.off('refreshCallout', refreshReceived);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshCallout = () => {
    console.log('refreshCallout');
    queryClient.invalidateQueries({ queryKey: calloutQueryKey(idInt) });
    queryClient.invalidateQueries({ queryKey: calloutLogQueryKey(idInt) });
  };

  const refreshReceived = (_data) => {
    refreshCallout();
  };

  const tabChanged = (index: number) => {
    setCurrentTab(index);
    refreshCallout();
  };

  const responseSelected = (payload: { text: string; start_time?: string | null; end_time?: string | null }) => {
    console.log('selected response', payload);
    submitCalloutResponse(payload);
    setModalVisible(false);
  };

  const submitCalloutResponse = async (payload: { text: string; start_time?: string | null; end_time?: string | null }) => {
    const idInt: number = Number.parseInt(id);
    calloutResponseMutation.mutate(
      {
        idInt,
        text: payload.text,
        start_time: payload.start_time,
        end_time: payload.end_time,
      },
    );
  };

  const onLogMessageTextChanged = (text: string) => {
    setLogMessageText(text);
  };

  const submitLogMessage = async () => {
    calloutLogMutation.mutate({ message: logMessageText }, {
      onSuccess: () => {
        // Additionally refresh the callout data to update badge.
        queryClient.invalidateQueries({ queryKey: calloutQueryKey(idInt) });
      },

    });
    setLogMessageText('');
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Header title={headerTitle} background={headerBackground} backButton timestamp={calloutTimestamp} />
        {!!callout
          && (
            <>
              <TabSelector tabs={tabs} selected={currentTab} onTabChange={tabChanged} />
              <KeyboardAvoidingCustomView>
                <View style={styles.contentContainer}>
                  {currentTab === CalloutTabs.INFO
                    && (
                      <ScrollView
                        ref={scrollViewRef}
                        style={styles.scrollView}
                      >
                        <CalloutInformationTab
                          callout={callout}
                        />
                      </ScrollView>
                    )}
                  {currentTab === CalloutTabs.LOG
                    && (
                      <CalloutLogTab
                        id={idInt}
                        useInfiniteQueryFn={useCalloutLogInfiniteQuery}
                      />
                    )}
                  {currentTab === CalloutTabs.FILES
                    && <CalloutFileTab callout={callout} />}
                  {currentTab === CalloutTabs.PERSONNEL
                    && (
                      <ScrollView
                        ref={scrollViewRef}
                        style={styles.scrollView}
                      >
                        <CalloutPersonnelTab callout={callout} />
                      </ScrollView>
                    )}
                  {currentTab === CalloutTabs.INFO && isActive
                    && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[elements.capsuleButton, styles.respondCalloutButton]}
                        onPress={() => setModalVisible(true)}
                      >
                        <Text style={[elements.whiteButtonText, { fontSize: 18 }]}>{ respondButtonText }</Text>
                      </TouchableOpacity>
                    )}
                  {currentTab === CalloutTabs.LOG
                    && (
                      <LogInput
                        onTextChange={onLogMessageTextChanged}
                        text={logMessageText}
                        onSendPress={submitLogMessage}
                      />
                    )}
                </View>
              </KeyboardAvoidingCustomView>
            </>
          )}
      </SafeAreaView>
      <CalloutRespondModal
        modalVisible={modalVisible}
        responseTimeMode={responseTimeMode}
        myResponse={callout?.my_response ?? null}
        onSelect={responseSelected}
        onCancel={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBg,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    marginTop: 0,
    flex: 1,
    paddingTop: 10,
  },
  respondCalloutButton: {
    margin: 20,
    height: 60,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default Page;
