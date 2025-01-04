import {
  generateAuthToken,
  generateHmacSignature,
  serializeData,
  verifyAuthToken
} from './signature';
import { request } from './request';
import { ValidationError } from './errors';
import { ExtendedJwtPayload } from './types/jwt.types';
import { PublishResponseData, TokenResponse, TokenResponseParams } from './types/response.types';
import { ApiKeyParts, RelayBoxOptions } from './types/config.types';
import { validatePermissions, validateParams } from './validation';
import { WebhookPayload } from './types/webhook.types';
import { Rooms } from './rooms';
import { Auth } from './auth';

const DEFAULT_CORE_SERVICE_URL = `https://gnet.prod.relaybox-services.net`;
const DEFAULT_STATE_SERVICE_URL = `https://state.prod.relaybox-services.net`;
const DEFAULT_AUTH_SERVICE_URL = `https://auth.prod.relaybox-services.net`;
const DEFAULT_TOKEN_EXPIRY_SECS = 900;
const DEFAULT_TOKEN_TYPE = 'id_token';

/**
 * The RelayBox class provides methods to generate authentication tokens and publish events
 * to a specified service using an API key.
 */
export default class RelayBox {
  private apiKeyParts: ApiKeyParts;
  private coreServiceUrl: string;
  private stateServiceUrl: string;
  private authServiceUrl: string;
  public rooms: Rooms;
  public auth: Auth;

  /**
   * Creates an instance of RelayBox.
   * @param {RelayBoxOptions} options - The options for configuring the RelayBox instance.
   * @throws {ValidationError} If the API key is not provided or is invalid.
   */
  constructor({ apiKey, coreServiceUrl, stateServiceUrl, authServiceUrl }: RelayBoxOptions) {
    validateParams({ apiKey }, ['apiKey']);

    this.apiKeyParts = this.getApiKeyParts(apiKey);

    this.coreServiceUrl = coreServiceUrl ?? DEFAULT_CORE_SERVICE_URL;
    this.stateServiceUrl = stateServiceUrl ?? DEFAULT_STATE_SERVICE_URL;
    this.authServiceUrl = authServiceUrl ?? DEFAULT_AUTH_SERVICE_URL;

    this.auth = new Auth(this.apiKeyParts, this.authServiceUrl);
    this.rooms = new Rooms(this.apiKeyParts, this.coreServiceUrl, this.stateServiceUrl);
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

    const { publicKey, secretKey } = this.apiKeyParts;
    const timestamp = new Date().toISOString();

    const payload: ExtendedJwtPayload = {
      publicKey,
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
  async publish(
    roomId: string | string[],
    event: string,
    data: any,
    clientId?: string
  ): Promise<PublishResponseData> {
    validateParams({ roomId, event, data }, ['roomId', 'event', 'data']);

    const {
      body: requestBody,
      signature: requestSignature,
      publicKey
    } = this.prepareRequestParams(roomId, event, data, clientId);

    const requestParams = {
      method: 'POST',
      headers: {
        'X-Ds-Public-Key': publicKey,
        'X-Ds-Req-Signature': requestSignature
      },
      body: requestBody
    };

    const response = await request<PublishResponseData>(
      `${this.coreServiceUrl}/events`,
      requestParams
    );

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
    data: any,
    clientId?: string
  ): { body: string; signature: string; publicKey: string } {
    const timestamp = Date.now();

    const body = JSON.stringify({
      event,
      roomId,
      data,
      timestamp,
      clientId
    });

    const { publicKey, secretKey } = this.apiKeyParts;

    const signature = generateHmacSignature(body, secretKey);

    return { body, signature, publicKey };
  }

  /**
   * Splits the provided API key into its component parts.
   * @private
   * @param {string} apiKey - The API key in the format "appId.keyId:secretKey".
   * @returns {[string, string]} The public key and secret key as a tuple.
   * @throws {ValidationError} If the API key is not in the correct format.
   */
  private getApiKeyParts(apiKey: string): ApiKeyParts {
    const parts = apiKey.split(':');

    if (parts.length !== 2) {
      throw new ValidationError('API key must be in the format "appPid.keyId:secretKey"');
    }

    return {
      publicKey: parts[0],
      secretKey: parts[1]
    };
  }

  /**
   * Validates the provided auth token against the API key secret key.
   * @param {string} token - The auth token to be validated.
   * @returns {ExtendedJwtPayload} The decoded JWT payload.
   * @throws {TokenError} If the token is invalid.
   */
  public verifyAuthToken(token: string): ExtendedJwtPayload {
    const { secretKey } = this.apiKeyParts;

    return verifyAuthToken(token, secretKey);
  }

  /**
   * Verify the authenticity of a webhook request using the webhook signing key.
   * @param {WebhookPayload} webhookPayload - The body of the webhook request.
   * @param {string} requestSignature - The signature of the webhook request found at the `X-Relaybox-Webhook-Signature` header.
   * @param {string} signingKey - The webhook signing key generated in the Relaybox dashboard.
   * @returns {boolean} Whether the request is authentic.
   */
  public verifyWebhookSignature(
    webhookPayload: WebhookPayload,
    requestSignature: string,
    signingKey: string
  ): boolean {
    const serializedData = serializeData(webhookPayload);
    const generatedSignature = generateHmacSignature(serializedData, signingKey);

    return generatedSignature === requestSignature;
  }
}
