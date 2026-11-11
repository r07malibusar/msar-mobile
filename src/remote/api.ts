import type { LabelValue } from '../utility/reactForm';
import type { calloutGetLogResponse, loginResponse, tokenValidationResponse } from './responses';
import type { callout } from '@/types/callout';
import type { patrol } from '@/types/patrol';
import * as Application from 'expo-application';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { calloutFromResponse } from '@/types/callout';

const scv_server: string = 'https://app.scvrescue.com';
const countywide_server: string = 'https://countywide.app.malibusarhours.org';
const legacy_server: string = 'https://malibusarhours.org/calloutapi';
const dev_server: string = 'https://msar-dev-app.azurewebsites.net';
const demo_server: string = 'https://demo.app.malibusarhours.org';
const staging_server: string = 'https://staging.app.malibusarhours.org';
const prod_server: string = 'https://app.malibusarhours.org';

interface Server extends LabelValue {
  logo: any;
};

export const server_choices: Server[] = [
  { label: 'Malibu', value: 'prod', logo: require('@assets/logos/msar.png') },
  { label: 'Santa Clarita Valley', value: 'scv', logo: require('@assets/logos/scv.png') },
  { label: 'LASD Countywide', value: 'countywide', logo: require('@assets/logos/la_co.jpeg') },
  { label: 'Demo', value: 'demo', logo: require('@assets/logos/custom.png') },
  { label: 'Custom', value: '', logo: require('@assets/logos/custom.png') },
];

const server_all_choices: Server[] = [
  { label: 'Staging', value: 'staging', logo: require('@assets/logos/msar_bw.png') },
  { label: 'Dev', value: 'dev', logo: require('@assets/logos/msar_bw.png') },
  { label: 'Legacy', value: 'legacy', logo: require('@assets/logos/msar_bw.png') },
  ...server_choices,
];

export function logo_for_server(server: string) {
  const logo = server_all_choices.find(item => item.value === server)?.logo;
  return logo ?? require('@assets/logos/custom.png');
}

export class Api {
  #_server = '';
  #token: string | null = '';
  constructor(server: string, token: string | null) {
    this.#_server = server;
    this.#token = token;
  }

  logo() {
    return logo_for_server(this.#_server);
  }

  #server(): string {
    if (this.#_server?.startsWith('http')) {
      return this.#_server;
    }
    switch (this.#_server) {
      case 'scv':
        return scv_server;
      case 'countywide':
        return countywide_server;
      case 'legacy':
        return legacy_server;
      case 'dev':
        return dev_server;
      case 'demo':
        return demo_server;
      case 'staging':
        return staging_server;
    }
    return prod_server;
  }

  #tokenEndpoint(): string {
    return `${this.#server()}/api-token-auth/`;
  }

  #notificationsAvailableEndpoint(): string {
    return `${this.#server()}/api/event_notifications/`;
  }

  #radioChannelsAvailableEndpoint(): string {
    return `${this.#server()}/api/radio_channels/`;
  }

  #operationTypesAvailableEndpoint(): string {
    return `${this.#server()}/api/operation_types/`;
  }

  #calloutResponsesAvailableEndpoint(): string {
    return `${this.#server()}/api/callout_responses/`;
  }

  #calloutsEndpoint(): string {
    return `${this.#server()}/api/callouts/`;
  }

  #chatEndpoint(): string {
    return `${this.#server()}/api/announcement/log/`;
  }

  #eventsEndpoint(): string {
    return `${this.#server()}/api/events/?is_operation=false`;
  }

  #patrolsEndpoint(): string {
    return `${this.#server()}/api/patrols/`;
  }

  #memberStatusTypesEndpoint(): string {
    return `${this.#server()}/api/member_status_types/`;
  }

  #membersEndpoint(): string {
    return `${this.#server()}/api/members/`;
  }

  #certsEndpoint(): string {
    return `${this.#server()}/api/certs/`;
  }

  #teamCertsEndpoint(): string {
    return `${this.#server()}/api/member_certs/`;
  }

  #devicesEndpoint(): string {
    return `${this.#server()}/api/devices/`;
  }

  #tokenValidationEndpoint(): string {
    return `${this.#server()}/api/?format=json`;
  }

  #filesEndpoint(): string {
    return `${this.#server()}/api/files/`;
  }

  #authorizationHeader() {
    if (!this.#token) {
      throw new Error('No token');
    }
    return `Token ${this.#token}`;
  }

  async #fetchWithCredentials(url: string, method: string = 'GET', body?: any, contentType?: string): Promise<any> {
    const options = {
      method,
      headers: {
        'Authorization': this.#authorizationHeader(),
        'Content-Type': contentType || 'application/json',
      },
      body: body || null,
    };
    const response = await fetch(url, options);
    if (!response.ok) {
      const msg = await response.text();
      console.log(response.status, msg);
      throw new Error(`Network response was ${response.status}: ${msg}`);
    }
    return response;
  }

  async #fetchJsonWithCredentials(url: string, method: string = 'GET', body?: any): Promise<any> {
    const json_body = body ? JSON.stringify(body) : null;
    return (await this.#fetchWithCredentials(url, method, json_body)).json();
  }

  async downloadWithCredentials(url: string, destination: string) {
    const options = {
      headers: { Authorization: this.#authorizationHeader() },
      idempotent: true,
    };
    const d = new Directory(Paths.document);
    console.log('downloadWithCredentials', url, destination, d.exists);
    d.create({ idempotent: true, intermediates: true });
    return File.downloadFileAsync(url, new File(Paths.document, destination), options);
  }

  async login(server: string, username: string, password: string): Promise<loginResponse> {
    this.#_server = server;
    console.log('Logging into', this.#server());
    return this.#apiGetToken(username, password);
  }

  async #apiGetToken(username: string, password: string): Promise<loginResponse> {
    return fetch(this.#tokenEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })
      .then(response => response.json())
      .then((data) => {
        return data;
      })
      .catch((error) => {
        console.log(error);
        return {
          non_field_errors: [
            'Server Error',
          ],
        };
      });
  }

  async apiValidateToken(): Promise<tokenValidationResponse> {
    if (!this.#token) {
      return { valid_token: false };
    }

    return fetch(this.#tokenValidationEndpoint(), {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.#token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          return { valid_token: true };
        }
        else {
          return { valid_token: false };
        }
      // console.log("response status " + response.status);
      })
      .catch((error) => {
        console.log(error);
        return { valid_token: false };
      });
  }

  async apiGetNotificationsAvailable(): Promise<any> {
    return this.#fetchJsonWithCredentials(`${this.#notificationsAvailableEndpoint()}?ordering=position`);
  }

  async apiGetRadioChannelsAvailable(): Promise<any> {
    return this.#fetchJsonWithCredentials(`${this.#radioChannelsAvailableEndpoint()}?ordering=position`);
  }

  async apiGetOperationTypesAvailable(): Promise<any> {
    return this.#fetchJsonWithCredentials(`${this.#operationTypesAvailableEndpoint()}?ordering=position`);
  }

  async apiGetCalloutResponsesAvailable(): Promise<any> {
    return this.#fetchJsonWithCredentials(`${this.#calloutResponsesAvailableEndpoint()}?ordering=position`);
  }

  async apiGetCallouts(status?: string): Promise<any> {
    let args = '?ordering=-id';
    if (status) {
      args += `&status=${status}`;
    }

    return this.#fetchJsonWithCredentials(this.#calloutsEndpoint() + args);
  }

  async apiCreateCallout(callout: callout): Promise<any> {
    return this.#fetchJsonWithCredentials(this.#calloutsEndpoint(), 'POST', callout);
  }

  async apiGetCallout(id: number): Promise<callout> {
    return this.#fetchJsonWithCredentials(`${this.#calloutsEndpoint() + id}/`).then((data) => {
      return calloutFromResponse(data);
    });
  }

  async apiUpdateCallout(id: number, callout: callout): Promise<any> {
    return this.#fetchJsonWithCredentials(
      `${(this.#calloutsEndpoint()) + id}/`,
      'PUT',
      callout,
    );
  }

  async apiRespondToCallout(id: number, response: string, startTime?: string | null, endTime?: string | null): Promise<any> {
    const payload: any = { response };
    if (startTime !== undefined) {
      payload.start_time = startTime;
    }
    if (endTime !== undefined) {
      payload.end_time = endTime;
    }
    return this.#fetchJsonWithCredentials(
      `${(this.#calloutsEndpoint()) + id}/respond/`,
      'POST',
      payload,
    );
  }

  async #apiGetLogResponseFromUrl(url: string, pageParam?: string): Promise<calloutGetLogResponse> {
    const fullUrl = pageParam || `${url}?ordering=-id`;
    console.log('full url', fullUrl);

    return this.#fetchJsonWithCredentials(fullUrl);
  }

  async apiGetCalloutLog(id: number, pageParam?: string): Promise<calloutGetLogResponse> {
    return this.#apiGetLogResponseFromUrl(`${this.#calloutsEndpoint() + id}/log/`, pageParam);
  }

  async apiGetChatLog(pageParam: string): Promise<calloutGetLogResponse> {
    return this.#apiGetLogResponseFromUrl(this.#chatEndpoint(), pageParam);
  }

  async #apiPostLogFromUrl(url: string, message: string): Promise<any> {
    return this.#fetchJsonWithCredentials(url, 'POST', {
      type: 'message',
      message,
    });
  }

  async apiPostCalloutLog(id: number, message: string): Promise<any> {
    return this.#apiPostLogFromUrl(`${this.#calloutsEndpoint() + id}/log/`, message);
  }

  async apiPostChatLog(message: string): Promise<any> {
    return this.#apiPostLogFromUrl(this.#chatEndpoint(), message);
  }

  async apiGetEvents(args: string): Promise<any> {
    return this.#fetchJsonWithCredentials(this.#eventsEndpoint() + args);
  }

  async apiGetPatrols(args: string): Promise<any> {
    return this.#fetchJsonWithCredentials(this.#patrolsEndpoint() + args);
  }

  async apiCreatePatrol(patrol: patrol): Promise<any> {
    return this.#fetchJsonWithCredentials(this.#patrolsEndpoint(), 'POST', patrol);
  }

  async apiUpdatePatrol(id: number, patrol: patrol): Promise<any> {
    return this.#fetchJsonWithCredentials(
      `${(this.#patrolsEndpoint()) + id}/`,
      'PUT',
      patrol,
    );
  }

  async apiRemovePatrol(id: number) {
    try {
      const data = await this.#fetchWithCredentials(
        `${this.#patrolsEndpoint() + id}/`,
        'DELETE',
      );
      console.log(`removed patrol: ${JSON.stringify(data)}`);
    }
    catch (error) {
      console.log(error);
      // eslint-disable-next-line no-alert
      alert(`Error removing patrol: ${error.message}`);
    }
  }

  async apiGetMemberStatusTypes(): Promise<any> {
    return this.#fetchJsonWithCredentials(this.#memberStatusTypesEndpoint());
  }

  async apiGetMembers(): Promise<any> {
    return this.#fetchJsonWithCredentials(this.#membersEndpoint());
  }

  async apiGetCerts(member_id?: number): Promise<any> {
    const params = (member_id === undefined) ? '' : `?member=${member_id}`;
    return this.#fetchJsonWithCredentials(this.#certsEndpoint() + params);
  }

  async apiGetTeamCerts(): Promise<any> {
    return this.#fetchJsonWithCredentials(this.#teamCertsEndpoint());
  }

  async apiSetDeviceId(token: string, active: boolean = true) {
    const tokenInfo = {
      name: Application.nativeApplicationVersion,
      registration_id: token,
      device_id: active ? 'msar' : 'msar-disabled',
      active,
      type: Platform.OS === 'ios' ? 'ios' : 'android',
    };

    try {
      const data = await this.#fetchJsonWithCredentials(
        this.#devicesEndpoint(),
        'POST',
        tokenInfo,
      );
      console.log(`assigned push token: ${JSON.stringify(data)}`);
    }
    catch (error) {
      console.log(`Error saving push token: ${error.message}`);
    }
  }

  async apiRemoveDeviceId(token: string) {
    try {
      const data = await this.#fetchWithCredentials(
        `${this.#devicesEndpoint() + token}/`,
        'DELETE',
      );
      console.log(`removed push token: ${JSON.stringify(data)}`);
    }
    catch (error) {
      console.log(error);
      // eslint-disable-next-line no-alert
      alert(`Error removing push token: ${error.message}`);
    }
  }

  async apiGetDeviceId(token: string): Promise<any> {
    if (!token)
      return Promise.reject(new Error('No token'));
    try {
      const data = await this.#fetchJsonWithCredentials(
        `${this.#devicesEndpoint() + token}/`,
        'GET',
      );
      console.log(`get push token: ${JSON.stringify(data)}`);
      return data;
    }
    catch (error) {
    // 404 indicates it is not stored.
      console.log(error);
      return Promise.reject(error);
    }
  }

  async apiIsDeviceIdActive(token: string): Promise<boolean> {
    const device = await this.apiGetDeviceId(token);
    return device.active;
  }

  async apiUpdateDeviceId(token: string) {
    this.apiGetDeviceId(token).then(
      (data) => {
        if (data.name !== Application.nativeApplicationVersion) {
          console.log('updating stored version');
          this.apiSetDeviceId(token, data.active);
        }
      },
      () => this.apiSetDeviceId(token, true),
    );
  }

  async apiUploadFile(file, id: string) {
    const body = new FormData();
    body.append('file', file);
    body.append('event', id);
    return this.#fetchWithCredentials(this.#filesEndpoint(), 'POST', body, 'multipart/form-data');
  }

  #apiGetDownloadFileUrl(id: number) {
    return `${this.#filesEndpoint() + id}/download/`;
  }

  async apiDownloadFile(id: number, destination: string) {
    return this.downloadWithCredentials(this.#apiGetDownloadFileUrl(id), destination);
  }

  async apiRemoveFile(id: number) {
    try {
      const data = await this.#fetchWithCredentials(
        `${this.#filesEndpoint() + id}/`,
        'DELETE',
      );
      console.log(`removed file: ${JSON.stringify(data)}`);
    }
    catch (error) {
      console.log(error);
      // eslint-disable-next-line no-alert
      alert(`Error removing file: ${error.message}`);
    }
  }
}
