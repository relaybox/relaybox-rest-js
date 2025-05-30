import { vi, describe, it, expect, afterEach, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import RelayBox from '../lib/relaybox';
import jwt from 'jsonwebtoken';
import { ExtendedJwtPayload } from '../lib/types/jwt.types';
import { generateHmacSignature } from '../lib/signature';
import { HTTPRequestError } from '../lib/errors';
import { WebhookPayload } from '../lib/types/webhook.types';
import { Session } from '../lib/types/auth.types';

const server = setupServer();
const mockCoreServiceUrl = `http://localhost:9000/core`;
const mockSecretKey = `abcde`;
const mockApiKey = `appPid.keyId:${mockSecretKey}`;
const mockclientId = `12345`;
const mockDate = new Date('2023-01-01T00:00:00Z');

function isJwtExpired(token: string, secret: string) {
  try {
    jwt.verify(token, secret);
    return false;
  } catch (err: any) {
    return err.message.includes('jwt expired');
  }
}

describe('RelayBox', () => {
  let relayBox: RelayBox;

  beforeEach(() => {
    relayBox = new RelayBox({
      apiKey: mockApiKey,
      coreServiceUrl: mockCoreServiceUrl
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
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

      const [publicKey] = mockApiKey.split(':');
      const { token, expiresIn } = relayBox.generateTokenResponse(params);

      expect(expiresIn).toEqual(tokenExpirySecs);

      const decodedToken = jwt.decode(token) as ExtendedJwtPayload;

      expect(decodedToken?.publicKey).toEqual(publicKey);
      expect(decodedToken?.clientId).toEqual(mockclientId);
      expect(decodedToken?.permissions).toEqual(params.permissions);

      expect(() => jwt.verify(token, mockSecretKey)).not.toThrow(Error);
    });

    it('should set custom expiry on generated auth token', async () => {
      vi.useFakeTimers({ now: mockDate.getTime() });

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
      vi.useFakeTimers({ now: mockDate.getTime() });

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
      vi.useRealTimers();
      server.resetHandlers();
    });

    afterAll(() => {
      server.close();
    });

    describe('success', () => {
      it('should sucessfully publish an event', async () => {
        vi.useFakeTimers({ now: mockDate.getTime() });

        const publishOptions = {
          transient: true,
          clientId: '12345'
        };

        const mockSignature = generateHmacSignature(
          JSON.stringify({
            event: mockEvent,
            roomId: mockRoomid,
            data: mockPayload,
            timestamp: Date.now(),
            options: publishOptions
          }),
          mockSecretKey
        );

        server.use(
          http.post(`${mockCoreServiceUrl}/events`, ({ request }) => {
            const publicKey = request.headers.get('x-ds-public-key');
            const signature = request.headers.get('x-ds-req-signature');

            if (publicKey === mockPublicKey && signature === mockSignature) {
              return HttpResponse.json({ timestamp: Date.now(), signature });
            }

            return new HttpResponse(null, { status: 401 });
          })
        );

        await expect(
          relayBox.publish(mockRoomid, mockEvent, mockPayload, publishOptions)
        ).resolves.toEqual(
          expect.objectContaining({
            timestamp: Date.now(),
            signature: mockSignature
          })
        );
      });
    });

    describe('error', () => {
      it('should throw HTTPRequestError if response in non 2xx', async () => {
        vi.useFakeTimers({ now: mockDate.getTime() });

        const mockSignature = generateHmacSignature(
          JSON.stringify({
            event: mockEvent,
            roomId: mockRoomid,
            data: mockPayload,
            timestamp: Date.now()
          }),
          mockSecretKey
        );

        vi.advanceTimersByTime(1);

        server.use(
          http.post(`${mockCoreServiceUrl}/events`, ({ request }) => {
            const signature = request.headers.get('x-ds-req-signature');

            if (signature !== mockSignature) {
              return new HttpResponse(null, { status: 401 });
            }

            return HttpResponse.json({ timestamp: Date.now(), signature });
          })
        );

        await expect(relayBox.publish(mockRoomid, mockEvent, mockPayload)).rejects.toThrow(
          HTTPRequestError
        );
      });
    });
  });
});
