export interface OAuthTokens {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
}

export interface OAuthUser {
  providerId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

export interface OAuthStatePayload {
  nonce: string;
  timestamp: number;
}