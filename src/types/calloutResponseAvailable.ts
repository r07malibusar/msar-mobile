export interface calloutResponseAvailable {
  id: number;
  position: number;
  response: string;
  is_attending: boolean;
  triggers_start_time?: boolean;
  triggers_end_time?: boolean;
  allow_initial?: boolean;
  allowed_from?: string | null;
  compatible_response_time_mode?: string | null;
  color: string;
}
