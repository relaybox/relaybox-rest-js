import { DsPermissions, Permission } from './permission.types';

export interface DsTokenResponseParams {
  clientId?: string | string[];
  expiresIn?: number;
  permissions?: Permission[] | DsPermissions;
}

export interface DsTokenResponse {
  token: string;
  // signature: string;
  expiresIn: number;
}

export interface DsPublishResponseData {
  timestamp: string;
  signature: string;
}
