import prisma from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { UserRole } from '@prisma/client';

// ==========================
// 🔐 LOGIN
// ==========================
export async function loginUser(username: string, pass: string) {
  // 1. ค้นหา User
  const user = await prisma.user.findFirst({
    where: {
      username: username,
      isActive: true,
    },
    // ไม่ต้อง include status แล้ว เพราะ role อยู่ในตัว
  });

  if (!user) {
    throw new Error('ไม่พบผู้ใช้งาน หรือบัญชีถูกระงับ');
  }

  // 2. ตรวจสอบรหัสผ่าน
  const isValid = await verifyPassword(pass, user.password);
  if (!isValid) {
    throw new Error('รหัสผ่านไม่ถูกต้อง');
  }

  // 3. สร้าง Token
  // ✅ FIX: ใช้ role แทน statusId
  const token = await signToken({
    userId: user.id,
    role: user.role, 
  });

  // ตัด password ออกก่อนส่งกลับ
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

// ==========================
// 📝 REGISTER (สำหรับ Caregiver ผ่าน LINE)
// ==========================
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
  road?: string; // เพิ่ม road เข้ามาด้วยตาม Schema
}) {
  
  // 1. เช็คว่ามี LINE ID นี้หรือยัง
  const existingUser = await prisma.user.findFirst({
    where: { lineId: data.lineId },
  });

  if (existingUser) {
    throw new Error('LINE ID นี้ได้ลงทะเบียนแล้ว');
  }

  // 2. สร้าง Password สุ่ม (เพราะ Login ผ่าน Line ไม่ได้ใช้ pass)
  const randomPassword = Math.random().toString(36).slice(-10);
  const hashedPassword = await hashPassword(randomPassword);

  // 3. สร้าง User พร้อม Profile (Nested Write)
  // ✅ FIX: เขียนลง 2 ตารางพร้อมกัน (User + CaregiverProfile)
  const user = await prisma.user.create({
    data: {
      // --- ข้อมูล Core User ---
      username: data.lineId, // ใช้ LineID เป็น username ไปเลย (Unique แน่นอน)
      password: hashedPassword,
      lineId: data.lineId,
      role: UserRole.CAREGIVER, // ✅ กำหนด Role เป็นผู้ดูแล
      isActive: true,

      // --- ข้อมูล Profile ---
      caregiverProfile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || '',
          
          // ที่อยู่
          houseNumber: data.houseNumber || '',
          village: data.village || '',
          road: data.road || '',
          subDistrict: data.subDistrict || '',
          district: data.district || '',
          province: data.province || '',
          postalCode: data.postalCode || '',
          
          // วันเกิด (Required ใน Schema แต่ Form อาจจะไม่มี ส่งค่า Default ไปก่อนได้)
          birthday: new Date(), 
        }
      }
    },
    include: {
        caregiverProfile: true // ดึง Profile กลับมาดูด้วย
    }
  });

  return user;
}