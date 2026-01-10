'use server';

import prisma from '@/lib/db/prisma';

export async function getUnreadAlertCount() {
  try {
    const falls = await prisma.fallRecord.count({ where: { status: 'DETECTED' } });
    const soss = await prisma.extendedHelp.count({ where: { status: 'DETECTED' } });
    return { count: falls + soss };
  } catch (error) {
    return { count: 0 };
  }
}