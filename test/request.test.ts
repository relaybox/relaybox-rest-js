import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { request } from '../lib/request';
import { HTTPRequestError, NetworkError, TimeoutError } from '../lib/errors';

const server = setupServer();
const mockDate = new Date('2024-01-01T00:00:00Z');
const mockCoreServiceUrl = `http://localhost:9000/core`;

describe('request', () => {
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

  describe('error', () => {
    it('should throw Networkerror if network unavailable', async () => {
      vi.useFakeTimers({ now: mockDate.getTime() });

      server.use(http.post(mockCoreServiceUrl, () => HttpResponse.error()));

      const requestPromise = request(mockCoreServiceUrl, { method: 'POST' });

      await expect(requestPromise).rejects.toThrow(NetworkError);
    });

    it('should throw HTTPRequestError if response in non 2xx', async () => {
      vi.useFakeTimers({ now: mockDate.getTime() });

      server.use(http.post(mockCoreServiceUrl, () => new HttpResponse(null, { status: 401 })));

      const requestPromise = request(mockCoreServiceUrl, { method: 'POST' });

      await expect(requestPromise).rejects.toThrow(HTTPRequestError);
    });

    // https://github.com/vitest-dev/vitest/issues/3088
    it.skip('should throw TimeoutError if request times out', async () => {
      vi.useFakeTimers({ now: mockDate.getTime() });

      server.use(
        http.post(mockCoreServiceUrl, () => {
          return new Promise(() => {});
        })
      );

      const requestPromise = request(mockCoreServiceUrl, { method: 'POST' });

      console.log(1, Date.now());
      vi.advanceTimersByTime(20000);
      console.log(2, Date.now());

      await expect(requestPromise).rejects.toThrow(TimeoutError);
    });
  });
});
