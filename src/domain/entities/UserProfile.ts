export type UserRole = 'admin' | 'cliente';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}
