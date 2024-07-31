import { vi, describe, it, expect, afterEach, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { RelayBox } from '../lib/relaybox';
import jwt from 'jsonwebtoken';
import { ExtendedJwtPayload } from '../lib/types/jwt.types';
import { generateHmacSignature } from '../lib/signature';
import { HTTPRequestError } from '../lib/errors';

const server = setupServer();
const mockEventsEndpoint = 'http://localhost:4004/dev';
const mockSecretKey = `abcde`;
const mockApiKey = `appPid.keyId:${mockSecretKey}`;
const mockclientId = `12345`;

function isJwtExpired(token: string, secret: string) {
  try {
    jwt.verify(token, secret);
    return false;
  } catch (err: any) {
    return err.message.includes('jwt expired');
  }
}

describe('Ds', () => {
  let relayBox: RelayBox;

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    relayBox = new RelayBox({ apiKey: mockApiKey });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateTokenResponse', () => {
    it('should generate a valid auth token signed with client secret', async () => {
      const tokenExpirySecs = 300;
      const params = {
        clientId: mockclientId,
        expiresIn: tokenExpirySecs,
        permissions: {
          '*': ['subscribe']
        }
      };

      const [keyName] = mockApiKey.split(':');
      const { token, expiresIn } = relayBox.generateTokenResponse(params);

      expect(expiresIn).toEqual(tokenExpirySecs);

      const decodedToken = jwt.decode(token) as ExtendedJwtPayload;

      expect(decodedToken?.keyName).toEqual(keyName);
      expect(decodedToken?.clientId).toEqual(mockclientId);
      expect(decodedToken?.permissions).toEqual(params.permissions);

      expect(() => jwt.verify(token, mockSecretKey)).not.toThrow(Error);
    });

    it('should set custom expiry on generated auth token', async () => {
      const expiresIn = 300;
      const params = {
        expiresIn
      };

      const { token } = relayBox.generateTokenResponse(params);

      vi.advanceTimersByTime((expiresIn - 1) * 1000);
      expect(isJwtExpired(token, mockSecretKey)).toBe(false);

      vi.advanceTimersByTime(1 * 1000);
      expect(isJwtExpired(token, mockSecretKey)).toBe(true);
    });

    it('should set default expiry on generated auth token', async () => {
      const defaultExpirySecs = 900;
      const params = {};

      const { token } = relayBox.generateTokenResponse(params);

      vi.advanceTimersByTime((defaultExpirySecs - 1) * 1000);
      expect(isJwtExpired(token, mockSecretKey)).toBe(false);

      vi.advanceTimersByTime(1 * 1000);
      expect(isJwtExpired(token, mockSecretKey)).toBe(true);
    });
  });

  describe('publish', () => {
    const mockRoomid = 'test:room';
    const mockEvent = 'testEvent';
    const mockPayload = { message: 'testing' };
    const mockPublicKey = mockApiKey.split(':')[0];

    beforeAll(() => {
      server.listen();
    });

    afterEach(() => {
      server.resetHandlers();
    });

    afterAll(() => {
      server.close();
    });

    describe('success, 2xx', () => {
      it('should sucessfully publish an event', async () => {
        const mockSignature = generateHmacSignature(
          JSON.stringify({
            event: mockEvent,
            roomId: mockRoomid,
            data: mockPayload,
            timestamp: new Date().toISOString()
          }),
          mockSecretKey
        );

        server.use(
          http.post(mockEventsEndpoint, ({ request }) => {
            const publicKey = request.headers.get('x-ds-public-key');
            const signature = request.headers.get('x-ds-req-signature');

            if (publicKey === mockPublicKey && signature === mockSignature) {
              return HttpResponse.json({ timestamp: new Date().toISOString(), signature });
            }

            return new HttpResponse(null, { status: 401 });
          })
        );

        await expect(relayBox.publish(mockRoomid, mockEvent, mockPayload)).resolves.toEqual(
          expect.objectContaining({
            timestamp: new Date().toISOString(),
            signature: mockSignature
          })
        );
      });
    });

    describe('error, 4xx / 5xx', () => {
      it('should throw an error if response in non 2xx', async () => {
        const mockSignature = generateHmacSignature(
          JSON.stringify({
            event: mockEvent,
            roomId: mockRoomid,
            data: mockPayload,
            timestamp: new Date().toISOString()
          }),
          mockSecretKey
        );

        vi.advanceTimersByTime(1);

        server.use(
          http.post(mockEventsEndpoint, ({ request }) => {
            const signature = request.headers.get('x-ds-req-signature');

            if (signature !== mockSignature) {
              return new HttpResponse(null, { status: 401 });
            }

            return HttpResponse.json({ timestamp: new Date().toISOString(), signature });
          })
        );

        await expect(relayBox.publish(mockRoomid, mockEvent, mockPayload)).rejects.toThrow(
          HTTPRequestError
        );
      });
    });
  });
});
