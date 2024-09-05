import { Permissions, Permission } from './permission.types';

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
  signature: string;
}
