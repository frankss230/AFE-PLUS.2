'use server';

import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';

export async function getSidebarCounts() {
  const cookieStore = await cookies();

  const lastViewedCaregivers = cookieStore.get('last_viewed_caregivers')?.value;
  const lastViewedDependents = cookieStore.get('last_viewed_dependents')?.value;

  const caregiverDate = lastViewedCaregivers ? new Date(lastViewedCaregivers) : new Date(0);
  const dependentDate = lastViewedDependents ? new Date(lastViewedDependents) : new Date(0);

  try {
    const [alerts, transactions, caregivers, dependents] = await Promise.all([
      
      prisma.extendedHelp.count({
        where: { status: 'DETECTED' },
      }),

      prisma.borrowEquipment.count({
        where: {
          status: { in: ['PENDING', 'RETURN_PENDING'] },
        },
      }),

      prisma.caregiverProfile.count({
        where: {
          createdAt: { gt: caregiverDate },
        },
      }),

      prisma.dependentProfile.count({
        where: {
          createdAt: { gt: dependentDate },
        },
      }),
    ]);

    return {
      alerts,
      transactions,
      caregivers,
      dependents,
    };
  } catch (error) {
    console.error('Error fetching sidebar counts:', error);
    return { alerts: 0, transactions: 0, caregivers: 0, dependents: 0 };
  }
}

export async function markAsViewed(type: 'caregivers' | 'dependents') {
  const cookieStore = await cookies();
  const now = new Date().toISOString();

  cookieStore.set(`last_viewed_${type}`, now);
}