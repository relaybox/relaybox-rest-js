import { defaultHeaders, serviceRequest } from './request.js';
import { generateAuthToken } from './signature.js';
import { ApiKeyParts, ExtendedJwtPayload, HttpMethod } from './types/index.js';
import { Room, RoomMemberType, RoomOptions, RoomTokenType } from './types/rooms.types.js';

const STATE_SERVICE_PATHS = {
  rooms: '/rooms'
};

interface MemberActions {
  /**
   * Get paginated list of members.
   * @param {PaginatedRequestOptions} opts The clientId of the member to add
   * @example
   * await room.members.get({ offset: 0, limit: 10 })
   */
  // get: (opts?: PaginatedRequestOptions) => Promise<PaginatedResponse<RoomMember>>;
  /**
   * Add member to private room. Private rooms only.
   * @param {string} clientId The clientId of the member to add
   */
  add: (roomId: string, clientId: string, authToken: string) => Promise<void>;
  /**
   * Remove member from private room. Private rooms only.
   * @param clientId The clientId of the member to delete
   */
  // remove: (clientId: string) => Promise<void>;
  /**
   * Set member type for client id.
   * @param clientId The clientId of the member to delete
   * @param memberType The member type to set for this user
   */
  setMemberType: (
    roomid: string,
    clientId: string,
    memberType: RoomMemberType,
    authToken: string
  ) => Promise<void>;
}

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

    return serviceRequest<Room>(requestUrl, requestParams);
  }

  /**
   * Add a user to a private room by client id
   * @param {string} roomId - The name of the room.
   * @param {string} clientId - The client id of the user to add.
   * @param {string} authToken - The authorization token.
   * @returns
   */
  async addMember(roomId: string, clientId: string, authToken: string) {
    const requestBody = {
      roomId,
      clientId
    };

    const requestParams = {
      method: HttpMethod.POST,
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(requestBody)
    };

    const requestUrl = `${this.stateServiceUrl}${STATE_SERVICE_PATHS.rooms}/${roomId}/members`;

    return serviceRequest<any>(requestUrl, requestParams);
  }

  /**
   * Set member type for client id.
   * @param {string} roomId - The name of the room.
   * @param {string} clientId - The client id of the user to add.
   * @param {RoomMemberType} memberType - The member type to set for this user
   * @param {string} authToken - The authorization token.
   * @returns
   */
  async setMemberType(
    roomId: string,
    clientId: string,
    memberType: RoomMemberType,
    authToken: string
  ) {
    const requestBody = {
      roomId,
      clientId,
      memberType
    };

    const requestParams = {
      method: HttpMethod.PUT,
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(requestBody)
    };

    const requestUrl = `${this.stateServiceUrl}${STATE_SERVICE_PATHS.rooms}/${roomId}/members/${clientId}`;

    return serviceRequest<any>(requestUrl, requestParams);
  }

  readonly members: MemberActions = {
    add: this.addMember.bind(this),
    setMemberType: this.setMemberType.bind(this)
  };
}
