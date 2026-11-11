import type { calloutResponseAvailable } from '@/types/calloutResponseAvailable';
import type { dataFile } from '@/types/dataFile';
import type { calloutStatus } from '@/types/enums';
import type { location } from '@/types/location';
import type { operationalPeriod } from '@/types/operationalPeriod';
import type { user } from '@/types/user';
import { dataFileFromResponse } from '@/types/dataFile';
import { stringToCalloutStatus } from '@/types/enums';

export interface callout {
  id?: number;
  title: string;
  operation_type: string;
  description?: string;
  subject?: string;
  subject_contact?: string;
  informant?: string;
  informant_contact?: string;
  radio_channel?: string;
  additional_radio_channels?: string[];
  notifications_made?: string[];
  status: calloutStatus;
  resolution?: string;
  location?: location;
  operational_periods?: operationalPeriod[];
  files?: dataFile[];
  handling_unit?: string;
  created_at?: Date;
  my_response?: string;
  created_by?: user;
  log_count?: number;
  log_last_id?: number;
}

export function calloutFromResponse(data: any): callout {
  return {
    id: data.id,
    title: data.title,
    operation_type: data.operation_type,
    description: data.description,
    subject: data.subject,
    subject_contact: data.subject_contact,
    informant: data.informant,
    informant_contact: data.informant_contact,
    radio_channel: data.radio_channel,
    additional_radio_channels: data.additional_radio_channels,
    notifications_made: data.notifications_made,
    status: stringToCalloutStatus(data.status),
    resolution: data.resolution,
    location: data.location,
    operational_periods: data.operational_periods?.map((op: any) => ({
      ...op,
      responses: op.responses?.map((r: any) => ({
        ...r,
        start_time: r.start_time ? new Date(r.start_time) : undefined,
        end_time: r.end_time ? new Date(r.end_time) : undefined,
        signed_in_at: r.signed_in_at ? new Date(r.signed_in_at) : undefined,
        signed_out_at: r.signed_out_at ? new Date(r.signed_out_at) : undefined,
        created_at: r.created_at ? new Date(r.created_at) : (r.signed_in_at ? new Date(r.signed_in_at) : undefined),
        updated_at: r.updated_at ? new Date(r.updated_at) : undefined,
      })),
    })),
    files: data.files?.map(dataFileFromResponse) ?? [],
    handling_unit: data.handling_unit,
    created_at: new Date(data.created_at),
    my_response: data.my_response,
    created_by: data.created_by,
    log_count: data.log_count,
    log_last_id: data.log_last_id,
  };
}

export function calloutResponseBadge(
  callout: callout | undefined,
  calloutResponsesAvailableMap: Map<string, calloutResponseAvailable>,
): string | undefined {
  if (callout?.operational_periods && callout.operational_periods[0]) {
    const responses = callout.operational_periods[0].responses;
    let badgeCount = 0;
    responses.forEach((response) => {
      const t = calloutResponsesAvailableMap?.get(response.response);
      if (t && t.is_attending) {
        badgeCount += 1;
      }
    });
    if (badgeCount > 0) {
      return `${badgeCount}`;
    }
  }

  return undefined;
}
