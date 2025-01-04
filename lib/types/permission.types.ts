export const allowedPermissions = [
  'create',
  'join',
  'subscribe',
  'publish',
  'presence',
  'metrics',
  'history',
  '*'
] as const;

export type Permission = (typeof allowedPermissions)[number];

export interface Permissions {
  [room: string]: string[];
}
