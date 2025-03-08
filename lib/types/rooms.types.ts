export type RoomTokenType = 'basic_access';
export type RoomVisibility = 'public' | 'private' | 'protected' | 'authorized';
export type RoomMemberType = 'owner' | 'admin' | 'member';

export interface RoomOptions {
  roomName?: string;
  visibility?: RoomVisibility;
  memberType?: RoomMemberType;
  password?: string;
}

export interface Room {
  id: string;
  uuid: string;
  visibility: RoomVisibility;
}

export interface RoomPublishOptions {
  clientId?: string;
  transient?: boolean;
}
