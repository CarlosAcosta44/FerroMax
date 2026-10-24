import { UserProfile, UserRole } from '@/domain/entities/UserProfile';

export interface SignUpDTO {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

export interface SignInDTO {
  email: string;
  password: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
  } | null;
  profile: UserProfile | null;
}

export interface IAuthRepository {
  signUp(dto: SignUpDTO): Promise<{ user: any; profile: UserProfile }>;
  signIn(dto: SignInDTO): Promise<{ user: any; profile: UserProfile }>;
  signOut(): Promise<void>;
  getCurrentSession(): Promise<AuthSession>;
  getProfile(userId: string): Promise<UserProfile | null>;
}
