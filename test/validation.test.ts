import { describe, it, expect } from 'vitest';
import { ValidationError } from '../lib/errors';
import { validateParams, checkMissingParams, validatePermissions } from '../lib/validation';

describe('Parameter Validation', () => {
  describe('checkMissingParams', () => {
    it('should return an empty array if no parameters are missing', () => {
      const params = { name: 'test', age: 25 };
      const requiredParams = ['name', 'age'];

      expect(checkMissingParams(params, requiredParams)).toEqual([]);
    });

    it('should return a list of missing parameters', () => {
      const params = { name: 'test' };
      const requiredParams = ['name', 'age'];

      expect(checkMissingParams(params, requiredParams)).toEqual(['age']);
    });

    it('should handle empty inputs', () => {
      const params = {};
      const requiredParams: string[] = [];

      expect(checkMissingParams(params, requiredParams)).toEqual([]);
    });
  });

  describe('validateParams', () => {
    it('should not throw an error if all required params are provided', () => {
      const params = { name: 'test', age: 25 };
      const requiredParams = ['name', 'age'];

      expect(() => validateParams(params, requiredParams)).not.toThrow();
    });

    it('should throw ValidationError if required params are missing', () => {
      const params = { name: 'test' };
      const requiredParams = ['name', 'age'];

      expect(() => validateParams(params, requiredParams)).toThrow(ValidationError);
    });
  });

  describe('validatePermissions', () => {
    it('should validate permissions if undefined', () => {
      const permissions = null;

      expect(validatePermissions(permissions)).toBe(true);
    });

    it('should validate permissions with global wildcard correctly', () => {
      const permissions = ['*'];

      expect(validatePermissions(permissions)).toBe(true);
    });

    it('should validate permissions with room level wildcard correctly', () => {
      const permissions = {
        chat: ['*'],
        config: ['publish', 'presence']
      };

      expect(validatePermissions(permissions)).toBe(true);
    });

    it('should validate permissions with key based wildcard entries', () => {
      const permissions = {
        'chat:*:123': ['*'],
        config: ['publish', 'presence']
      };

      expect(validatePermissions(permissions)).toBe(true);
    });

    it('should validate structured permissions correctly', () => {
      const permissions = {
        chat: ['subscribe', 'publish'],
        config: ['presence']
      };

      expect(validatePermissions(permissions)).toBe(true);
    });

    it('should throw ValidationError if permissions is not an object or wildcard', () => {
      const permissions = 'invalid';

      expect(() => validatePermissions(permissions)).toThrow(ValidationError);
    });

    it('should throw ValidationError if room permissions are not an array', () => {
      const permissions = {
        chat: 'subscribe'
      };

      expect(() => validatePermissions(permissions)).toThrow(ValidationError);
    });

    it('should throw ValidationError if a permission is invalid', () => {
      const permissions = {
        chat: ['subscribe', 'dance']
      };

      expect(() => validatePermissions(permissions)).toThrow(ValidationError);
    });

    it('should throw ValidationError if permissions contain special characters', () => {
      const permissions = {
        'room:@:!': ['subscribe']
      };

      expect(() => validatePermissions(permissions)).toThrow(ValidationError);
    });
  });
});
