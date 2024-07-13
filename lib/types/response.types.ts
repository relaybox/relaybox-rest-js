import { Permissions, Permission } from './permission.types';

export interface TokenResponseParams {
  clientId?: string | string[];
  expiresIn?: number;
  permissions?: Permission[] | Permissions;
}

export interface TokenResponse {
  token: string;
  // signature: string;
  expiresIn: number;
}

export interface PublishResponseData {
  timestamp: string;
  signature: string;
}
