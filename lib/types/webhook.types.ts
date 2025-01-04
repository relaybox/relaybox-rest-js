import { Session } from './auth.types.js';

export interface WebhookPayload {
  id: string;
  event: string;
  data: any;
  session: Session;
  timestamp: string;
  filterAttributes?: Record<string, unknown>;
}
