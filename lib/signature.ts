import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ExtendedJwtPayload } from './types/jwt.types.js';
import { SignatureError, TokenError, ValidationError } from './errors.js';
import { canonicalize } from 'json-canonicalize';

const JWT_ISSUER = `https://relaybox.net`;
const JWT_HASHING_ALGORITHM = 'HS256';
const SIGNATURE_HASHING_ALGORITHM = 'sha256';
const SIGNATURE_BUFFER_ENCODING = 'utf-8';
const SIGNTURE_DIGEST = 'hex';

export function generateHmacSignature(stringToSign: string, signingKey: string): string {
  if (!stringToSign || !signingKey) {
    throw new ValidationError(`Please provide string to sign and signing key`);
  }

  try {
    const buffer = Buffer.from(stringToSign, SIGNATURE_BUFFER_ENCODING);
    const signature = crypto
      .createHmac(SIGNATURE_HASHING_ALGORITHM, signingKey)
      .update(buffer)
      .digest(SIGNTURE_DIGEST);

    return signature;
  } catch (err: any) {
    throw new SignatureError(`Failed to generate signature, ${err.message}`);
  }
}

export function generateAuthToken(
  payload: ExtendedJwtPayload,
  secretKey: string,
  expiresIn: number
): string {
  if (!payload || !secretKey || !expiresIn) {
    throw new ValidationError(`Please provide valid payload, secret key and expiry timeout`);
  }

  try {
    return jwt.sign(payload, secretKey, {
      expiresIn,
      algorithm: JWT_HASHING_ALGORITHM,
      issuer: JWT_ISSUER
    });
  } catch (err: any) {
    throw new TokenError(`Failed to generate token, ${err.message}`);
  }
}

export function verifyAuthToken(token: string, secretKey: string): ExtendedJwtPayload {
  try {
    return jwt.verify(token, secretKey) as ExtendedJwtPayload;
  } catch (err: any) {
    throw new TokenError(`Failed to validate token, ${err.message}`);
  }
}

export function serializeData(data: any): string {
  try {
    const canonicalizedData = canonicalize(data);
    const serializedData = JSON.stringify(canonicalizedData);
    return serializedData;
  } catch (err: unknown) {
    throw new SignatureError(`failed to serialze data, ${err}`);
  }
}
