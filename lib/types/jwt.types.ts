import { JwtPayload } from 'jsonwebtoken';
import { Permissions, Permission } from './permission.types.js';

export interface ExtendedJwtPayload extends JwtPayload {
  publicKey: string;
  clientId?: string | string[];
  timestamp: string;
  permissions?: Permissions | Permission[];
  scope?: string;
  tokenType?: string;
}
