export interface ApiData {
  message?: string;
}

export interface FormattedResponse<T> {
  status: number;
  data: T;
  message?: string;
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

export enum HttpMode {
  CORS = 'cors',
  NAVIGATE = 'navigate',
  NO_CORS = 'no-cors',
  SAME_ORIGIN = 'same-origin',
  STRICT_ORIGIN = 'strict-origin',
  STRICT_ORIGIN_WHEN_CROSS_ORIGIN = 'strict-origin-when-cross-origin',
  UNSAFE_URL = 'unsafe-url'
}
