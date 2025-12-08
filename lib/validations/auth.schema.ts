import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

export const registerSchema = z.object({
  lineId: z.string().min(1, 'LINE ID จำเป็น'),
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  phone: z.string().regex(/^[0-9]{10}$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง'),
  username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร').optional(),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  pin: z.number().int().min(1000, 'PIN ต้องมี 4 หลักขึ้นไป').max(999999, 'PIN ไม่เกิน 6 หลัก'),
  houseNumber: z.string().optional(),
  village: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().regex(/^[0-9]{5}$/, 'รหัสไปรษณีย์ไม่ถูกต้อง').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;