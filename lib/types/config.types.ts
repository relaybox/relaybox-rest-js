export interface RelayBoxOptions {
  apiKey: string;
  coreServiceUrl?: string;
  stateServiceUrl?: string;
  authServiceUrl?: string;
}

export interface ApiKeyParts {
  publicKey: string;
  secretKey: string;
}
