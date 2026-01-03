import { User, Session } from '@supabase/supabase-js';

export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
}

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role: string;
  aud: string;
  exp: number;
  iat: number;
}
