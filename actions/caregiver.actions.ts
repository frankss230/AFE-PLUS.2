"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateCaregiver(userId: number, data: any) {
  try {
    const {
      role,
      isActive,
      
      firstName,
      lastName,
      phone,
      birthday,
      gender,
      maritalStatus,
      
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
        caregiverProfile: {
          update: {
            firstName,
            lastName,
            phone,
            birthday: birthday ? new Date(birthday) : undefined,
            gender,
            marital: maritalStatus,
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