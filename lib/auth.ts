import { serviceRequest } from './request.js';
import { verifyAuthToken } from './signature.js';
import { ApiKeyParts, ExtendedJwtPayload, HttpMethod } from './types/index.js';
import { AuthUser, AuthUserIdentity } from './types/auth.types.js';

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

    const requestUrl = `${this.authServiceUrl}/users/${clientId}`;

    return serviceRequest<AuthUser>(requestUrl, requestParams);
  }

  /**
   * Get user by client id
   * @param clientId user client id
   * @param authToken auth token to authenticate the request
   */
  getUserIdentity(authToken: string, provider: string) {
    const { publicKey } = this.apiKeyParts;

    const requestParams = {
      method: HttpMethod.GET,
      headers: {
        'X-Ds-Public-Key': publicKey,
        Authorization: `Bearer ${authToken}`
      }
    };

    const requestUrl = `${this.authServiceUrl}/identity?provider=${provider}`;

    return serviceRequest<AuthUserIdentity>(requestUrl, requestParams);
  }
}
