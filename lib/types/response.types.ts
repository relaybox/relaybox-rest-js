import { Permissions, Permission } from './permission.types.js';

export interface TokenResponseParams {
  clientId?: string | string[];
  expiresIn?: number;
  permissions?: Permission[] | Permissions;
}

export interface TokenResponse {
  token: string;
  expiresIn: number;
  expiresAt: number;
}

export interface PublishResponseData {
  timestamp: string;
  requestId: string;
}
