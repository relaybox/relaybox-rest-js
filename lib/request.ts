import { HTTPRequestError, NetworkError } from './errors';
import { ApiData, FormattedResponse } from './types/request.types';

const NODE_FETCH_ERR_MESSAGES = ['Failed to fetch'];

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
    response = await fetch(url, params);

    if (!response.ok) {
      throw new HTTPRequestError(`${response.status} ${response.statusText}`, response.status);
    }
  } catch (err: any) {
    if (err instanceof TypeError && NODE_FETCH_ERR_MESSAGES.includes(err.message)) {
      throw new NetworkError('Network request failed: Unable to connect to the server', 0);
    } else {
      throw err;
    }
  }

  const formattedResponse = await formatResponse<T>(response);

  return formattedResponse;
}
