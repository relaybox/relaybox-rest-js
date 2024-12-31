import { defaultHeaders, serviceRequest } from './request';
import { generateAuthToken } from './signature';
import { ApiKeyParts, ExtendedJwtPayload, HttpMethod } from './types';
import { Room, RoomOptions, RoomTokenType } from './types/rooms.types';

const STATE_SERVICE_PATHS = {
  rooms: '/rooms'
};

export class Rooms {
  constructor(
    private apiKeyParts: ApiKeyParts,
    public coreServiceUrl: string,
    public stateServiceUrl: string
  ) {}

  /**
   * Generate room access token
   * @param {string} roomId - The room ID.
   * @param {string} clientId - The client ID.
   * @param {number} expiresIn - The expiration time in seconds.
   */
  generateAccessToken(
    roomId: string,
    clientId: string,
    tokenType: RoomTokenType,
    expiresIn: number
  ): string {
    const { publicKey, secretKey } = this.apiKeyParts;
    const timestamp = new Date().toISOString();

    const payload: ExtendedJwtPayload = {
      publicKey,
      roomId,
      clientId,
      timestamp,
      tokenType,
      expiresIn
    };

    const token = generateAuthToken(payload, secretKey, expiresIn);

    return token;
  }

  /**
   * Create a new room
   * @param {string} roomId - The name of the room.
   * @param {string} authToken - The authorization token.
   * @param {RoomOptions} roomOptions - The options for the room.
   */
  async create(roomId: string, authToken: string, roomOptions: RoomOptions = {}): Promise<Room> {
    const {
      roomName = null,
      visibility = 'public',
      memberType = 'member',
      password = null
    } = roomOptions;

    const requestBody = {
      roomId,
      roomName,
      memberType,
      visibility,
      password
    };

    const requestParams: RequestInit = {
      method: HttpMethod.POST,
      body: JSON.stringify(requestBody),
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${authToken}`
      }
    };

    const requestUrl = `${this.stateServiceUrl}${STATE_SERVICE_PATHS.rooms}`;

    return serviceRequest<any>(requestUrl, requestParams);
  }
}
