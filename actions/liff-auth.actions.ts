'use server';

import prisma from '@/lib/db/prisma';

export type UserStatus = 'UNREGISTERED' | 'NO_ELDERLY' | 'COMPLETE';

export async function checkLiffUserStatus(lineId: string): Promise<UserStatus> {
  try {
    const user = await prisma.user.findFirst({
      where: { lineId: lineId },
      include: { 
          caregiverProfile: true 
      } 
    });

    if (!user) {
      return 'UNREGISTERED'; // ยังไม่เคยลงทะเบียน
    }

    // 2. เช็คว่ามี Caregiver Profile ไหม
    if (!user.caregiverProfile) {
        return 'UNREGISTERED'; // มีแต่ User ว่างเปล่า (แปลกๆ) ให้ลงทะเบียนใหม่
    }

    // 3. เช็คว่าดูแลใครอยู่ไหม (ในตาราง CaregiverProfile จะมี dependents array)
    const caregiverWithDependents = await prisma.caregiverProfile.findUnique({
        where: { id: user.caregiverProfile.id },
        include: { dependents: true }
    });

    if (!caregiverWithDependents || caregiverWithDependents.dependents.length === 0) {
        return 'NO_ELDERLY'; // มีบัญชีผู้ดูแลแล้ว แต่ยังไม่มีคนแก่
    }

    return 'COMPLETE'; // ครบหมดแล้ว

  } catch (error) {
    console.error("Auth Check Error:", error);
    return 'UNREGISTERED'; // กันตาย
  }
}