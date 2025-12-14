'use server';

import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateAdminProfile(userId: number, formData: any) {
  try {
    // ✅ เพิ่ม image ในการรับค่า
    const { firstName, lastName, phone, position, username, password, newPassword, image } = formData;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: 'User not found' };

    let passwordHash = undefined;
    if (newPassword && newPassword.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: {
                username: username,
                ...(passwordHash && { password: passwordHash }),
            }
        }),
        prisma.adminProfile.update({
            where: { userId: userId },
            data: {
                firstName,
                lastName,
                phone,
                position,
                // ✅ เพิ่มบรรทัดนี้ครับ: บันทึกรูปลงฐานข้อมูล
                image: image 
            }
        })
    ]);

    revalidatePath('/admin');
    return { success: true };

  } catch (error) {
    console.error("Update Profile Error:", error);
    return { success: false, error: 'อัปเดตข้อมูลไม่สำเร็จ' };
  }
}

// ดึงข้อมูล Admin ล่าสุด
export async function getAdminProfile(userId: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { adminProfile: true }
    });
    
    if (!user || !user.adminProfile) return null;

    return {
        username: user.username,
        firstName: user.adminProfile.firstName,
        lastName: user.adminProfile.lastName,
        phone: user.adminProfile.phone,
        position: user.adminProfile.position,
        image: user.adminProfile.image
    };
}