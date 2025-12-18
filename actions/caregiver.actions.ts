"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateCaregiver(userId: number, data: any) {
  try {
    const {
      role,
      isActive,
      // lineId, // ❌ ไม่ต้องเอามา update เพราะเรา disable ไว้หน้าบ้านแล้ว (หรือถ้าจะกันเหนียวก็เอาออก)
      
      // Profile
      firstName,
      lastName,
      phone,
      birthday,
      gender,         // ✅ เพศ
      maritalStatus,  // ✅ สถานะสมรส (เพิ่มใหม่)
      
      // Address
      houseNumber,
      village,
      road,
      subDistrict,
      district,
      province,
      postalCode,
    } = data;

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: role,
        isActive: isActive,
        // lineId: lineId, // ไม่ต้องอัปเดต LineID
        caregiverProfile: {
          update: {
            firstName,
            lastName,
            phone,
            birthday: birthday ? new Date(birthday) : undefined,
            gender,
            marital: maritalStatus, // ✅ Map ค่าจาก form (maritalStatus) ไปลง db field (marital)
            houseNumber,
            village,
            road,
            subDistrict,
            district,
            province,
            postalCode,
          },
        },
      },
    });

    revalidatePath("/admin/caregivers");
    revalidatePath(`/admin/caregivers/${userId}`);
    
    return { success: true };

  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "ไม่สามารถบันทึกข้อมูลได้" };
  }
}