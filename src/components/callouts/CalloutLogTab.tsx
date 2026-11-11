import type { logEntry } from '@/types/logEntry';
import LogMessageField from '@components/fields/log/LogMessageField';
import LogResponseField from '@components/fields/log/LogResponseField';
import LogSystemField from '@components/fields/log/LogUpdateField';
import TextAreaField from '@components/fields/TextAreaField';
import { useEffect } from 'react';
import { FlatList } from 'react-native';
import { storeLastRead } from 'storage/mmkv';
import { logType } from '@/types/enums';
import { logEntriesFromInfiniteQueryData } from '@/types/logEntry';

interface CalloutLogTabProps {
  id: number;
  useInfiniteQueryFn: (id: number) => any;
};

function CalloutLogTab({ id, useInfiniteQueryFn }: CalloutLogTabProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQueryFn(id);

  const logList: logEntry[] = logEntriesFromInfiniteQueryData(data);

  useEffect(() => {
    if (!isLoading && logList != null) {
      if (logList?.length) {
        const lastId = Number.parseInt(logList[0].id);
        if (!Number.isNaN(lastId)) {
          storeLastRead(id, lastId);
        }
      }
      else {
        storeLastRead(id, 0); // User looked at the empty log.
      }
    }
  }, [id, isLoading, logList]);

  if (isLoading) {
    return (<TextAreaField value="Loading..." />);
  }

  const refreshList = () => {
    console.log('refresh');
    refetch();
  };

  const getMore = () => {
    console.log('more');
    if (!isFetching && hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <FlatList
      data={logList}
      renderItem={({ item }) => {
        switch (item.type) {
          case logType.RESPONSE:
            return (
              <LogResponseField
                key={item.id}
                member={item.member}
                response={item.update ?? ''}
                timestamp={item.created_at}
                startTime={item.start_time}
                endTime={item.end_time}
              />
            );
          case logType.SYSTEM:
            return (<LogSystemField key={item.id} member={item.member} update={item.update ?? ''} timestamp={item.created_at} />);
          case logType.MESSAGE:
            return (
              <LogMessageField
                key={item.id}
                member={item.member}
                message={item.message ?? ''}
                timestamp={item.created_at}
                status={item.status ?? ''}
                id={item.id}
                callout_id={id}
              />
            );
          case logType.INVALID:
            return null;
        }
      }}
      inverted
      onStartReached={() => console.log('start')}
      onEndReached={() => getMore()}
      onRefresh={() => refreshList()}
      refreshing={isFetching && !isFetchingNextPage}
      removeClippedSubviews={false} // needed for text selection
    />
  );
}

export default CalloutLogTab;
