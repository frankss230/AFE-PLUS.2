'use server';

import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

// ==========================================
// 📍 อัปเดตพิกัดเจ้าหน้าที่ (ยิงรัวๆ มาที่นี่)
// ==========================================
export async function updateRescuerLocation(alertId: number, lat: number, lng: number) {
  try {
    await prisma.extendedHelp.update({
      where: { id: alertId },
      data: {
        rescuerLat: lat,
        rescuerLng: lng,
        // อัปเดต timestamp ล่าสุดด้วยก็ได้ ถ้าอยากรู้ว่าพิกัดไม่อัปเดตนานแค่ไหน
      }
    });
    // ไม่ต้อง revalidatePath ก็ได้ถ้าอยากให้เบาเครื่อง Server เพราะ War Room มันดึง Auto อยู่แล้ว
    return { success: true };
  } catch (error) {
    console.error("Update Rescuer Location Error:", error);
    return { success: false };
  }
}

// ==========================================
// 🚨 กดรับเคส (เปลี่ยนสถานะ + เริ่มงาน)
// ==========================================
export async function acceptCase(alertId: number, rescuerUserId: number) {
  try {
    await prisma.extendedHelp.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED', // เปลี่ยนเป็นสีเหลือง
        reporterId: rescuerUserId, // ผูกเจ้าหน้าที่กับเคสนี้
        rescuerLat: null, // รีเซ็ตพิกัดเก่า (ถ้ามี)
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

// ==========================================
// ✅ ปิดงาน (เปลี่ยนสถานะเป็น RESOLVED)
// ==========================================
export async function closeCase(alertId: number) {
  try {
    await prisma.extendedHelp.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED', // เปลี่ยนเป็นสีเขียว
      }
    });
    
    revalidatePath('/admin/monitoring');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}