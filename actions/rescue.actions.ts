'use server';

import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export async function updateRescuerLocation(alertId: number, lat: number, lng: number) {
  try {
    await prisma.extendedHelp.update({
      where: { id: alertId },
      data: {
        rescuerLat: lat,
        rescuerLng: lng,
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Update Rescuer Location Error:", error);
    return { success: false };
  }
}

export async function acceptCase(alertId: number, rescuerUserId: number) {
  try {
    await prisma.extendedHelp.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        reporterId: rescuerUserId,
        rescuerLat: null,
        rescuerLng: null
      }
    });

    revalidatePath('/admin/monitoring');
    return { success: true };
  } catch (error) {
    console.error("Accept Case Error:", error);
    return { success: false, error: "ไม่สามารถรับเคสได้" };
  }
}

export async function closeCase(alertId: number) {
  try {
    await prisma.extendedHelp.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
      }
    });
    
    revalidatePath('/admin/monitoring');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}