'use server';

import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateAdminProfile(userId: number, formData: any) {
    try {
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

export async function deleteSelfAccount(userId: number, currentUsername: string, confirmUsername: string, reason: string) {
    try {
        if (currentUsername !== confirmUsername) {
            return { success: false, error: 'Username ยืนยันไม่ถูกต้อง' };
        }

        if (!reason || reason.trim().length === 0) {
            return { success: false, error: 'กรุณาระบุเหตุผลในการลบบัญชี' };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { adminProfile: true }
        });

        if (!user) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };

        console.log(`[AUDIT] Admin ${user.username} (ID: ${userId}) deleted their own account. Reason: ${reason}`);

        // Perform deletion
        await prisma.user.delete({ where: { id: userId } });

        // In a real app, you might want to sign the user out here or handle session cleanup client-side
        return { success: true };

    } catch (error) {
        console.error("Delete Self Account Error:", error);
        return { success: false, error: 'ลบบัญชีไม่สำเร็จ' };
    }
}