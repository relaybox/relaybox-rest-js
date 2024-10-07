import { HTTPRequestError, NetworkError, TimeoutError } from './errors';
import { ApiData, FormattedResponse } from './types/request.types';

const NODE_FETCH_ERR_MESSAGES = ['Failed to fetch'];
const DEFAULT_REQUEST_TIMEOUT = 10000;

async function formatResponse<T>(response: Response): Promise<FormattedResponse<T>> {
  const data = <T & ApiData>await response.json();

  return {
    status: response.status,
    data,
    ...(data.message && { message: data.message })
  };
}

export async function request<T>(
  url: URL | string,
  params: RequestInit
): Promise<FormattedResponse<T>> {
  let response: Response;

  try {
    const requestParams = {
      ...params,
      signal: AbortSignal.timeout(DEFAULT_REQUEST_TIMEOUT)
    };

    response = await fetch(url, requestParams);

    if (!response.ok) {
      throw new HTTPRequestError(`${response.status} ${response.statusText}`, response.status);
    }
  } catch (err: any) {
    if (err instanceof TypeError && NODE_FETCH_ERR_MESSAGES.includes(err.message)) {
      throw new NetworkError('Network request failed: Unable to connect to the server', 0);
    } else if (err.name === TimeoutError.name) {
      throw new TimeoutError(err.message, 0);
    } else {
      throw err;
    }
  }

  const formattedResponse = await formatResponse<T>(response);

  return formattedResponse;
}
