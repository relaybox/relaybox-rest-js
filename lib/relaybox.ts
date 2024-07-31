import { generateAuthToken, generateHmacSignature } from './signature';
import { request } from './request';
import { ValidationError } from './errors';
import { ExtendedJwtPayload } from './types/jwt.types';
import { PublishResponseData, TokenResponse, TokenResponseParams } from './types/response.types';
import { RelayBoxOptions } from './types/config.types';
import { validatePermissions, validateParams } from './validation';

// const DS_EVENTS_SERVICE_URL = `http://localhost:4004/dev`;
// const DS_EVENTS_SERVICE_URL = `https://events.dev.relaybox-services.net`;
const DS_EVENTS_SERVICE_URL = `https://events.prod.relaybox-services.net`;
const DEFAULT_TOKEN_EXPIRY_SECS = 900;

export class RelayBox {
  private apiKeyParts: [string, string];
  private dsEventsServiceUrl: string = DS_EVENTS_SERVICE_URL;

  constructor({ apiKey }: RelayBoxOptions) {
    validateParams({ apiKey }, ['apiKey']);
    this.apiKeyParts = this.getApiKeyParts(apiKey);
  }

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
      ...(permissions && { permissions }),
      ...(clientId && clientId != 'null' && { clientId })
    };

    const token = generateAuthToken(payload, secretKey, expiresIn);

    return {
      token,
      expiresIn
    };
  }

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

  private prepareRequestParams(
    roomId: string | string[],
    event: string,
    data: any
  ): [string, string, string] {
    const timestamp = new Date().toISOString();

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

  private getApiKeyParts(apiKey: string): [string, string] {
    const parts = apiKey.split(':');

    if (parts.length !== 2) {
      throw new ValidationError('API key must be in the format "appId.keyId:secretKey"');
    }

    return parts as [string, string];
  }
}
