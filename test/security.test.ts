import { describe, it, expect } from 'vitest';
import { ValidationError } from '../lib/errors';
import { generateHmacSignature, generateAuthToken } from '../lib/security';

const mockSigningKey = '12345';

describe('Security', () => {
  describe(`generateHmacSignature`, () => {
    it('should generate a hmac signature from stringified data payload', () => {
      const data = {
        testing: true,
        signature: true
      };

      const generatedSignature = generateHmacSignature(JSON.stringify(data), mockSigningKey);

      expect(generatedSignature).toBeDefined();
    });

    it('should throw ValidationError if string to sign are falsey', () => {
      // @ts-ignore
      expect(() => generateHmacSignature(null, mockSigningKey)).toThrow(ValidationError);
    });

    it('should throw ValidationError if signing key is falsey', () => {
      // @ts-ignore
      expect(() => generateHmacSignature('test', null)).toThrow(ValidationError);
    });
  });

  describe(`generateAuthToken`, () => {
    it('should generate an auth token from json payload', () => {
      const payload = {
        keyName: 'key',
        timestamp: 'now'
      };

      const generatedAuthToken = generateAuthToken(payload, mockSigningKey, 300);

      expect(generatedAuthToken).toBeDefined();
    });

    it('should throw ValidationError if required parameters are falsey', () => {
      // @ts-ignore
      expect(() => generateAuthToken(null, mockSigningKey, 300)).toThrow(ValidationError);
    });
  });
});
