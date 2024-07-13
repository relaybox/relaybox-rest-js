import { JwtPayload } from 'jsonwebtoken';
import { DsPermissions, Permission } from './permission.types';

export interface ExtendedJwtPayload extends JwtPayload {
  keyName: string;
  clientId?: string | string[];
  timestamp: string;
  permissions?: DsPermissions | Permission[];
}
