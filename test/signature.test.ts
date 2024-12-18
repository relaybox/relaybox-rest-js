import { describe, it, expect } from 'vitest';
import { ValidationError, TokenError } from '../lib/errors';
import {
  generateHmacSignature,
  generateAuthToken,
  verifyAuthToken,
  serializeData
} from '../lib/signature';

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

    it('should throw ValidationError if string to sign is falsey', () => {
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
        publicKey: 'key',
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

  describe(`verifyAuthToken`, () => {
    it('should validate auth token', () => {
      const payload = {
        publicKey: 'key',
        timestamp: 'now'
      };

      const generatedAuthToken = generateAuthToken(payload, mockSigningKey, 300);

      expect(verifyAuthToken(generatedAuthToken, mockSigningKey)).toEqual(
        expect.objectContaining(payload)
      );
    });

    it('should throw TokenError if signing key is invalid', () => {
      const payload = {
        publicKey: 'key',
        timestamp: 'now'
      };

      const invalidSigningKey = 'abcde';

      const generatedAuthToken = generateAuthToken(payload, mockSigningKey, 300);

      expect(() => verifyAuthToken(generatedAuthToken, invalidSigningKey)).toThrow(TokenError);
    });

    it('should throw TokenError if string to sign is falsey', () => {
      // @ts-ignore
      expect(() => verifyAuthToken(null, mockSigningKey)).toThrow(TokenError);
    });

    it('should throw TokenError if signing key is falsey', () => {
      // @ts-ignore
      expect(() => verifyAuthToken('test', null)).toThrow(TokenError);
      // @ts-ignore
      expect(() => verifyAuthToken('test', undefined)).toThrow(TokenError);
    });
  });

  describe('serializeData', () => {
    it('should cononically serialize json data', () => {
      const data = {
        z: 98,
        a: 123,
        c: 5
      };

      const serializedData = serializeData(data);

      expect(serializedData).toEqual('"{\\"a\\":123,\\"c\\":5,\\"z\\":98}"');
    });

    it('should cononically serialize string data', () => {
      const data = 'random string';

      const serializedData = serializeData(data);

      expect(serializedData).toEqual('"\\"random string\\""');
    });
  });
});
