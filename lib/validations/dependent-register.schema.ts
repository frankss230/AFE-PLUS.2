import { z } from 'zod';

export const dependentRegisterSchema = z.object({
  lineId: z.string(), 
  
  
  firstName: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  lastName: z.string().min(2, "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร"),
  
  
  pin: z.string().regex(/^\d{4}$/, "PIN ต้องเป็นตัวเลข 4 หลัก"),

  
  gender: z.enum(['MALE', 'FEMALE', 'UNSPECIFIED']),
  
  
  marital: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED']),
  
  
  birthday: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "กรุณาระบุวันเกิด",
  }),
  
  
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง"),

  
  diseases: z.string().optional(),    
  medications: z.string().optional(), 

  
  houseNumber: z.string().min(1, "ระบุบ้านเลขที่"),
  village: z.string().min(1, "ระบุหมู่ที่ (ถ้าไม่มีใส่ -)"),
  road: z.string().optional(), 
  subDistrict: z.string().min(1, "ระบุตำบล"),
  district: z.string().min(1, "ระบุอำเภอ"),
  province: z.string().min(1, "ระบุจังหวัด"),
  postalCode: z.string().min(5, "รหัสไปรษณีย์ไม่ถูกต้อง"),
});

export type DependentRegisterInput = z.infer<typeof dependentRegisterSchema>;