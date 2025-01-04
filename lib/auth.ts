import { serviceRequest } from './request';
import { verifyAuthToken } from './signature';
import { ApiKeyParts, ExtendedJwtPayload, HttpMethod } from './types/index';
import { AuthUser } from './types/auth.types';

const AUTH_SERVICE_PATHS = {
  users: '/users'
};

export class Auth {
  constructor(private apiKeyParts: ApiKeyParts, public authServiceUrl: string) {}

  /**
   * Validates the provided auth token against the API key secret key.
   * @param {string} token - The auth token to be validated.
   * @returns {ExtendedJwtPayload} The decoded JWT payload.
   * @throws {TokenError} If the token is invalid.
   */
  public verifyToken(token: string): ExtendedJwtPayload {
    const { secretKey } = this.apiKeyParts;

    return verifyAuthToken(token, secretKey);
  }

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

    const requestUrl = `${this.authServiceUrl}${AUTH_SERVICE_PATHS.users}/${clientId}`;

    return serviceRequest<AuthUser>(requestUrl, requestParams);
  }
}
