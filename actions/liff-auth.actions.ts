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
      return 'UNREGISTERED';
    }

    if (!user.caregiverProfile) {
        return 'UNREGISTERED';
    }

    const caregiverWithDependents = await prisma.caregiverProfile.findUnique({
        where: { id: user.caregiverProfile.id },
        include: { dependents: true }
    });

    if (!caregiverWithDependents || caregiverWithDependents.dependents.length === 0) {
        return 'NO_ELDERLY';
    }

    return 'COMPLETE';

  } catch (error) {
    console.error("Auth Check Error:", error);
    return 'UNREGISTERED';
  }
}