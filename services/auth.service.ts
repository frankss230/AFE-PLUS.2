import prisma from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { UserRole } from '@prisma/client';




export async function loginUser(username: string, pass: string) {
  
  const user = await prisma.user.findFirst({
    where: {
      username: username,
      isActive: true,
    },
    
  });

  if (!user) {
    throw new Error('ไม่พบผู้ใช้งาน หรือบัญชีถูกระงับ');
  }

  
  const isValid = await verifyPassword(pass, user.password);
  if (!isValid) {
    throw new Error('รหัสผ่านไม่ถูกต้อง');
  }

  
  
  const token = await signToken({
    userId: user.id,
    role: user.role, 
  });

  
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}




export async function registerUser(data: {
  lineId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  houseNumber?: string;
  village?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  road?: string; 
}) {
  
  
  const existingUser = await prisma.user.findFirst({
    where: { lineId: data.lineId },
  });

  if (existingUser) {
    throw new Error('LINE ID นี้ได้ลงทะเบียนแล้ว');
  }

  
  const randomPassword = Math.random().toString(36).slice(-10);
  const hashedPassword = await hashPassword(randomPassword);

  
  
  const user = await prisma.user.create({
    data: {
      
      username: data.lineId, 
      password: hashedPassword,
      lineId: data.lineId,
      role: UserRole.CAREGIVER, 
      isActive: true,

      
      caregiverProfile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || '',
          
          
          houseNumber: data.houseNumber || '',
          village: data.village || '',
          road: data.road || '',
          subDistrict: data.subDistrict || '',
          district: data.district || '',
          province: data.province || '',
          postalCode: data.postalCode || '',
          
          
          birthday: new Date(), 
        }
      }
    },
    include: {
        caregiverProfile: true 
    }
  });

  return user;
}