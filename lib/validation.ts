import { ValidationError } from './errors';
import { Permissions, Permission, allowedPermissions } from './types/permission.types';

export function validateParams(params: Record<string, any>, requiredParams: string[]) {
  const missingParams = checkMissingParams(params, requiredParams);

  if (missingParams.length > 0) {
    throw new ValidationError(`Missing required arguments: ${missingParams.join(', ')}`);
  }
}

export function checkMissingParams(
  params: Record<string, any>,
  requiredParams: string[]
): string[] {
  return requiredParams.filter((param) => !params[param]);
}

export function validatePermissions(permissions: any): permissions is Permissions {
  if (!permissions || (Array.isArray(permissions) && permissions[0] === '*')) {
    return true;
  }

  const specialCharacterRegex = /[!@#\$%\^\&\)\(+=.]/;

  if (typeof permissions === 'object' && permissions !== null) {
    for (const key in permissions) {
      if (specialCharacterRegex.test(key)) {
        throw new ValidationError(`Permissions include special characters`);
      }
    }
  }

  if (typeof permissions !== 'object' || permissions === null) {
    throw new ValidationError(`Permissions should be an object with room keys`);
  }

  for (const [room, perms] of Object.entries(permissions)) {
    if (!Array.isArray(perms)) {
      throw new ValidationError(
        `Permissions for room '${room}' should be an array containing ${allowedPermissions.join(
          ', '
        )}`
      );
    }

    perms.forEach((perm) => {
      if (!isValidPermission(perm)) {
        throw new ValidationError(
          `Invalid permission '${perm}' found in room '${room}'. Valid permissions are: ${allowedPermissions.join(
            ', '
          )}.`
        );
      }
    });
  }

  return true;
}

export function isValidPermission(perm: any): perm is Permission {
  return allowedPermissions.includes(perm as Permission);
}
