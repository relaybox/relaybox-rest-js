export const allowedPermissions = ['subscribe', 'publish', 'presence', 'metrics', '*'] as const;

export type Permission = (typeof allowedPermissions)[number];

export interface DsPermissions {
  [room: string]: string[];
}
