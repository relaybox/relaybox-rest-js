import { serviceRequest } from './request';
import { ApiKeyParts, HttpMethod } from './types';
import { AuthUser } from './types/auth.types';

export class Auth {
  constructor(private apiKeyParts: ApiKeyParts, public authServiceUrl: string) {}

  /**
   * Get user by client id
   * @param clientId user client id
   * @param authToken auth token to authenticate the request
   */
  getUser(clientId: string, authToken: string) {
    const { publicKey } = this.apiKeyParts;

    const requestParams = {
      method: HttpMethod.GET,
      headers: {
        'X-Ds-Public-Key': publicKey,
        Authorization: `Bearer ${authToken}`
      }
    };

    const requestUrl = `${this.authServiceUrl}/users/${clientId}`;

    return serviceRequest<AuthUser>(requestUrl, requestParams);
  }
}
