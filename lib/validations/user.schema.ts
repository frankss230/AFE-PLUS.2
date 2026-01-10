import { z } from 'zod';

export const userFormSchema = z.object({
  
  firstName: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  lastName: z.string().min(2, "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร"),
  phone: z.string().optional(),
  lineId: z.string().optional(),

  
  username: z.string().min(4, "Username ต้องมีอย่างน้อย 4 ตัวอักษร").optional(),
  password: z.string().optional(), 
  
  
  role: z.enum(['ADMIN', 'CAREGIVER', 'DEPENDENT']),
  isActive: z.boolean().default(true),

  
  houseNumber: z.string().optional(),
  village: z.string().optional(),
  road: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

export type UserFormInput = z.infer<typeof userFormSchema>;