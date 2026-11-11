import type { logType } from '@/types/enums';
import type { location } from '@/types/location';
import type { user } from '@/types/user';
import { stringToLogType } from '@/types/enums';

export interface logEntry {
  id: string; // numeric if from server, otherwise 'temp_*'
  type: logType;
  event: number;
  member: user;
  location?: location;
  message?: string;
  update?: string;
  start_time?: Date;
  end_time?: Date;
  status?: string; // app-only: not sent by server
  created_at: Date;
}

export function logEntryFromRespsonse(data: any): logEntry {
  return {
    id: data.id?.toString(),
    type: stringToLogType(data.type),
    event: data.event,
    member: data.member,
    location: data.location,
    message: data.message,
    update: data.update,
    start_time: data.start_time ? new Date(data.start_time) : undefined,
    end_time: data.end_time ? new Date(data.end_time) : undefined,
    status: data.status,
    created_at: new Date(data.created_at),
  };
}

export function logEntriesFromInfiniteQueryData(data: any): logEntry[] {
  return data?.pages
    ? data?.pages?.flatMap(page =>
        page?.results.map(r => logEntryFromRespsonse(r)),
      )
    : [];
}
