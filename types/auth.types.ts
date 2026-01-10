export interface UserSession {
  id: number;
  firstName: string;
  lastName: string;
  username: string | null; 
  statusId: number;
  lineId?: string | null;
}

export type AuthResponse =
  | {
      success: true;
      user?: UserSession; 
    }
  | {
      success: false;
      error: string; 
    };