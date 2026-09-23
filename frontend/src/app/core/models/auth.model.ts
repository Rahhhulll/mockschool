import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export type RegistrationRole = 'student' | 'mentor';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: RegistrationRole;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
