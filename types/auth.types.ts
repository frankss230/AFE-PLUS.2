export interface UserSession {
  id: number;
  firstName: string;
  lastName: string;
  username: string | null; // รองรับ null ตาม Prisma Schema
  statusId: number;
  lineId?: string | null;
}

export type AuthResponse =
  | {
      success: true;
      user?: UserSession; // อาจมีหรือไม่มีก็ได้ เพราะบางทีเรา Redirect เลย
    }
  | {
      success: false;
      error: string; // ข้อความ Error ที่จะนำไปแสดงในฟอร์ม
    };