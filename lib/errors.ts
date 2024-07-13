enum ErrorName {
  VALIDATION_ERROR = 'ValidationError',
  NETWORK_ERROR = 'NetworkError',
  HTTP_REQUEST_ERROR = 'HTTPRequestError',
  SIGNATURE_ERROR = 'SignatureError',
  TOKEN_ERROR = 'TokenError'
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = ErrorName.VALIDATION_ERROR;
  }
}

export class NetworkError extends Error {
  public status: number;

  constructor(message: string, status?: any) {
    super(message);
    this.status = status;
    this.name = ErrorName.NETWORK_ERROR;
  }
}

export class HTTPRequestError extends Error {
  public status: number;

  constructor(message: string, status?: any) {
    super(message);
    this.status = status;
    this.name = ErrorName.HTTP_REQUEST_ERROR;
  }
}

export class SignatureError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = ErrorName.SIGNATURE_ERROR;
  }
}

export class TokenError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = ErrorName.TOKEN_ERROR;
  }
}
