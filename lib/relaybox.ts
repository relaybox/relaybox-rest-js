import { generateAuthToken, generateHmacSignature } from './signature';
import { request } from './request';
import { ValidationError } from './errors';
import { ExtendedJwtPayload } from './types/jwt.types';
import { PublishResponseData, TokenResponse, TokenResponseParams } from './types/response.types';
import { RelayBoxOptions } from './types/config.types';
import { validatePermissions, validateParams } from './validation';

// const DS_EVENTS_SERVICE_URL = `https://events.prod.relaybox-services.net`;
const DS_EVENTS_SERVICE_URL = `http://localhost:4004/dev`;
const DEFAULT_TOKEN_EXPIRY_SECS = 900;
const DEFAULT_TOKEN_TYPE = 'id_token';

/**
 * The RelayBox class provides methods to generate authentication tokens and publish events
 * to a specified service using an API key.
 */
export class RelayBox {
  private apiKeyParts: [string, string];
  private dsEventsServiceUrl: string = DS_EVENTS_SERVICE_URL;

  /**
   * Creates an instance of RelayBox.
   * @param {RelayBoxOptions} options - The options for configuring the RelayBox instance.
   * @throws {ValidationError} If the API key is not provided or is invalid.
   */
  constructor({ apiKey }: RelayBoxOptions) {
    validateParams({ apiKey }, ['apiKey']);
    this.apiKeyParts = this.getApiKeyParts(apiKey);
  }

  /**
   * Generates a token response with a JWT based on the provided parameters.
   * @param {TokenResponseParams} params - Parameters including clientId, expiry time, and permissions.
   * @returns {TokenResponse} The generated token and its expiry time.
   * @throws {ValidationError} If permissions are invalid.
   */
  generateTokenResponse({
    clientId,
    expiresIn = DEFAULT_TOKEN_EXPIRY_SECS,
    permissions
  }: TokenResponseParams): TokenResponse {
    validatePermissions(permissions);

    const [keyName, secretKey] = this.apiKeyParts;
    const timestamp = new Date().toISOString();

    const payload: ExtendedJwtPayload = {
      keyName,
      timestamp,
      tokenType: DEFAULT_TOKEN_TYPE,
      ...(permissions && { permissions }),
      ...(clientId && clientId != 'null' && { clientId })
    };

    const token = generateAuthToken(payload, secretKey, expiresIn);
    const expiresAt = new Date().getTime() + expiresIn * 1000;

    return {
      token,
      expiresIn,
      expiresAt
    };
  }

  /**
   * Publishes an event to a specified room or rooms with the given data.
   * @param {string | string[]} roomId - The room ID or an array of room IDs.
   * @param {string} event - The event name.
   * @param {any} data - The data to be sent with the event.
   * @returns {Promise<PublishResponseData>} The response data from the publish request.
   * @throws {ValidationError} If required parameters are missing.
   */
  async publish(roomId: string | string[], event: string, data: any): Promise<PublishResponseData> {
    validateParams({ roomId, event, data }, ['roomId', 'event', 'data']);

    const [requestBody, requestSignature, publicKey] = this.prepareRequestParams(
      roomId,
      event,
      data
    );

    const requestParams = {
      method: 'POST',
      headers: {
        'X-Ds-Public-Key': publicKey,
        'X-Ds-Req-Signature': requestSignature
      },
      body: requestBody
    };

    const response = await request<PublishResponseData>(this.dsEventsServiceUrl, requestParams);

    return response.data;
  }

  /**
   * Prepares the request parameters including the request body, HMAC signature, and public key.
   * @private
   * @param {string | string[]} roomId - The room ID or an array of room IDs.
   * @param {string} event - The event name.
   * @param {any} data - The data to be sent with the event.
   * @returns {[string, string, string]} The request body, signature, and public key.
   */
  private prepareRequestParams(
    roomId: string | string[],
    event: string,
    data: any
  ): [string, string, string] {
    const timestamp = Date.now();

    const body = JSON.stringify({
      event,
      roomId,
      data,
      timestamp
    });

    const [publicKey, secretKey] = this.apiKeyParts;
    const signature = generateHmacSignature(body, secretKey);

    return [body, signature, publicKey];
  }

  /**
   * Splits the provided API key into its component parts.
   * @private
   * @param {string} apiKey - The API key in the format "appId.keyId:secretKey".
   * @returns {[string, string]} The public key and secret key as a tuple.
   * @throws {ValidationError} If the API key is not in the correct format.
   */
  private getApiKeyParts(apiKey: string): [string, string] {
    const parts = apiKey.split(':');

    if (parts.length !== 2) {
      throw new ValidationError('API key must be in the format "appId.keyId:secretKey"');
    }

    return parts as [string, string];
  }
}
