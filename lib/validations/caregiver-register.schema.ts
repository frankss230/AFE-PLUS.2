import { z } from 'zod';

export const caregiverRegisterSchema = z.object({
  lineId: z.string(),
  
  // --- ข้อมูลส่วนตัว ---
  firstName: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  lastName: z.string().min(2, "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  
  // ✅ แก้ไข: ลบ errorMap ออก (ใช้ค่า Default)
  gender: z.enum(['MALE', 'FEMALE', 'UNSPECIFIED']),

  // ✅ แก้ไข: ลบ errorMap ออก
  marital: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED']),

  // ✅ เพิ่ม: วันเกิด (รับเป็น String จาก input type="date")
  birthday: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "กรุณาระบุวันเกิด",
  }),

  // --- ที่อยู่ ---
  houseNumber: z.string().min(1, "ระบุบ้านเลขที่"),
  village: z.string().min(1, "ระบุหมู่ที่ (ถ้าไม่มีใส่ -)"), 
  road: z.string().optional(), 
  subDistrict: z.string().min(1, "ระบุตำบล"),
  district: z.string().min(1, "ระบุอำเภอ"),
  province: z.string().min(1, "ระบุจังหวัด"),
  postalCode: z.string().min(5, "รหัสไปรษณีย์ไม่ถูกต้อง"),
});

export type CaregiverRegisterInput = z.infer<typeof caregiverRegisterSchema>;