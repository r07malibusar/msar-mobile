import type { user } from '@/types/user';

export interface operationalPeriod {
  id: number;
  op: number;
  responses: opResponse[];
}

export interface opResponse {
  id: number;
  response: string;
  member: user;
  start_time?: Date;
  end_time?: Date;
  signed_in_at?: Date;
  signed_out_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}
