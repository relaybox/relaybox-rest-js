export interface ApiData {
  message?: string;
}

export interface FormattedResponse<T> {
  status: number;
  data: T;
  message?: string;
}
