import { z } from 'zod';

export const dependentRegisterSchema = z.object({
  lineId: z.string(), // Line ID ของผู้ดูแล (เพื่อเอาไปผูก)
  
  // --- ข้อมูลส่วนตัว ---
  firstName: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  lastName: z.string().min(2, "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร"),
  
  // ✅ เพิ่ม PIN: ต้องเป็นตัวเลข 4 ตัว
  pin: z.string().regex(/^\d{4}$/, "PIN ต้องเป็นตัวเลข 4 หลัก"),

  // เพศ (Enum)
  gender: z.enum(['MALE', 'FEMALE', 'UNSPECIFIED']),
  
  // สถานะสมรส (Enum)
  marital: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED']),
  
  // วันเกิด
  birthday: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "กรุณาระบุวันเกิด",
  }),
  
  // เบอร์โทร (นาฬิกา)
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง"),

  // --- ข้อมูลสุขภาพ ---
  diseases: z.string().optional(),    // โรคประจำตัว (ไม่บังคับ)
  medications: z.string().optional(), // ยาที่ทาน (ไม่บังคับ)

  // --- ที่อยู่ (บังคับตาม Schema) ---
  houseNumber: z.string().min(1, "ระบุบ้านเลขที่"),
  village: z.string().min(1, "ระบุหมู่ที่ (ถ้าไม่มีใส่ -)"),
  road: z.string().optional(), // ถนน (ไม่บังคับ)
  subDistrict: z.string().min(1, "ระบุตำบล"),
  district: z.string().min(1, "ระบุอำเภอ"),
  province: z.string().min(1, "ระบุจังหวัด"),
  postalCode: z.string().min(5, "รหัสไปรษณีย์ไม่ถูกต้อง"),
});

export type DependentRegisterInput = z.infer<typeof dependentRegisterSchema>;