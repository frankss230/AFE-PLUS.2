export interface User {
  id: number;
  lineId?: string;
  firstName: string;
  lastName: string;
  username?: string |null;
  phone?: string |null;
  statusId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  username?: string;
  password?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}