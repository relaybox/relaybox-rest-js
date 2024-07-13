export const allowedPermissions = ['subscribe', 'publish', 'presence', 'metrics', '*'] as const;

export type Permission = (typeof allowedPermissions)[number];

export interface Permissions {
  [room: string]: string[];
}
