export interface AuthUser {
  id: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  orgId: string;
  isOnline: boolean;
  lastOnline: string;
  appId: string;
  blockedAt: string | null;
}

export interface AuthUserIdentity {
  id: string;
  accessToken: string;
}

export interface Session {
  uid: string;
  appPid: string;
  keyId: string;
  clientId: string;
  exp: number;
  timestamp: string;
  connectionId: string;
  socketId: string;
  user?: AuthUser;
}
