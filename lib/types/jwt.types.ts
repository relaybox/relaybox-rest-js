import { JwtPayload } from 'jsonwebtoken';
import { Permissions, Permission } from './permission.types';

export interface ExtendedJwtPayload extends JwtPayload {
  keyName: string;
  clientId?: string | string[];
  timestamp: string;
  permissions?: Permissions | Permission[];
  scope?: string;
  tokenType?: string;
}
