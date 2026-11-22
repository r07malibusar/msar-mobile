export interface phone {
  id: number;
  number: string;
  type: string;
  position: number;
}

export interface user {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  username: string;
  mobile_phone?: string;
}

export interface user_detail extends user {
  status: string;
  status_order: number;
  color: string;
  is_current: boolean;
  is_available: boolean;
  is_patrol_eligible: boolean;
  is_display: boolean;
  phone_numbers: phone[];
  employee_id: string;
  radio_number?: string;
}

export interface member_status_type {
  id: string;
  short: string;
  long: string;
  position: number;
  color: string;
  is_current: boolean;
  is_available: boolean;
  is_display: boolean;
}

export function userToString(user?: user): string {
  if (!user) {
    return 'System';
  }
  return `${user.username} - ${user.full_name}`;
}

function stringCompareIgnoreCase(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'accent' });
}

export function compareUsername(a: user, b: user) {
  return stringCompareIgnoreCase(a.username, b.username);
}

export function isUserSelf(user?: user, self_username?: string): boolean {
  if (!user) {
    return false;
  }

  if (self_username) {
    return stringCompareIgnoreCase(self_username, user.username) === 0;
  }

  return false;
}

function phoneFromResponse(response) {
  return {
    ...response,
    number: response.display_number,
  };
}

export function userDetailsFromResponse(memberResponse: any): user_detail {
  return {
    ...memberResponse,
    mobile_phone: memberResponse.display_phone,
    first_name: memberResponse.short_name,
    phone_numbers: memberResponse.phone_set?.map(phoneFromResponse),
    employee_id: memberResponse.emp,
    radio_number: memberResponse.radio_number,
  };
}

export function memberStatusTypeFromResponse(response: any): member_status_type {
  return {
    ...response,
  };
}
