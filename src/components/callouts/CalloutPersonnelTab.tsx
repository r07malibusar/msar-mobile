import type { callout } from '@/types/callout';
import type { opResponse } from '@/types/operationalPeriod';
import InformationTray from '@components/fields/InformationTray';
import PersonnelField from '@components/fields/PersonnelField';
import colors, { textColorForBackground } from '@styles/colors';
import { elements } from '@styles/elements';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCalloutResponsesAvailableQuery, useOperationTypesAvailableQuery } from '@/remote/query';

interface CalloutPersonnelTabProps {
  callout: callout;
};

function CalloutPersonnelTab({ callout }: CalloutPersonnelTabProps) {
  const calloutResponesQuery = useCalloutResponsesAvailableQuery();
  const operationTypesQuery = useOperationTypesAvailableQuery();

  const currentOpType = operationTypesQuery.data?.results?.find(
    (o: any) => o.name?.toLowerCase() === callout?.operation_type?.toLowerCase(),
  );
  const responseTimeMode = currentOpType?.response_time_mode ?? 'promised_time';

  let responses: opResponse[] = [];
  if (callout.operational_periods && callout.operational_periods[0]) {
    responses = callout.operational_periods[0].responses;
  }

  const responseMap: any = [];
  let empty = true;

  if (calloutResponesQuery.data) {
    calloutResponesQuery.data.results.forEach((data: any) => {
      const backgroundColor: string = data.color ?? colors.white;
      const filtered = responses.filter((opResponse) => {
        return opResponse.response === data.response;
      });
      if (filtered.length > 0) {
        empty = false;
      }
      responseMap.push({
        key: data.id,
        title: data.response,
        backgroundColor,
        textColor: textColorForBackground(backgroundColor),
        responses: filtered,
      });
    });
  }

  return (
    <>
      {empty
        && <Text style={[elements.mediumText, styles.noResponses]}>No Responses</Text>}
      {responseMap.map((responseType) => {
        if (responseType.responses.length === 0)
          return null;
        return (
          <InformationTray
            key={responseType.key}
            title={responseType.title}
            titleBarColor={responseType.backgroundColor}
            titleTextColor={responseType.textColor}
            count={responseType.responses.length}
          >
            <View style={styles.preList} />
            {
              responseType.responses.map((opResponse: opResponse, index: number) => {
                const addDiv: boolean = (index < responseType.responses.length - 1);

                return (
                  <React.Fragment key={opResponse.member.id}>
                    <PersonnelField
                      key={opResponse.member.id}
                      opResponse={opResponse}
                      responseTimeMode={responseTimeMode}
                    />
                    {addDiv
                      && <View style={elements.informationDiv} />}
                  </React.Fragment>
                );
              })
            }
            <View style={styles.postList} />
          </InformationTray>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  noResponses: {
    margin: 20,
    textAlign: 'center',
    color: colors.grayText,
  },
  preList: {
    marginTop: 8,
  },
  postList: {
    marginBottom: 8,
  },
});

export default CalloutPersonnelTab;
