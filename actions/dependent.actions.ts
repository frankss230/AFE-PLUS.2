'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { UserRole } from '@prisma/client';

// Import Schema
import { dependentRegisterSchema, DependentRegisterInput } from '@/lib/validations/dependent-register.schema';

export async function registerElderly(data: DependentRegisterInput) {
  try {
    const validated = dependentRegisterSchema.parse(data);

    // หา Caregiver
    const caregiverUser = await prisma.user.findFirst({
      where: { lineId: validated.lineId },
      include: { caregiverProfile: true }
    });

    if (!caregiverUser || !caregiverUser.caregiverProfile) {
      return { success: false, error: 'ไม่พบข้อมูลผู้ดูแล' };
    }

    const randomUsername = `watch_${Date.now()}`; 
    const randomPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await hashPassword(randomPassword);

    await prisma.user.create({
      data: {
        username: randomUsername,
        password: hashedPassword,
        role: UserRole.DEPENDENT,
        isActive: true,

        dependentProfile: {
            create: {
                firstName: validated.firstName,
                lastName: validated.lastName,
                gender: validated.gender,
                
                marital: validated.marital, 

                birthday: new Date(validated.birthday),
                phone: validated.phone || '',
                diseases: validated.diseases || '',
                medications: validated.medications || '',
                houseNumber: validated.houseNumber,
                village: validated.village,
                road: validated.road || '',
                subDistrict: validated.subDistrict,
                district: validated.district,
                province: validated.province,
                postalCode: validated.postalCode,
                
                // PIN
                pin: validated.pin, 

                // ผูกกับ Caregiver
                caregiver: {
                    connect: { id: caregiverUser.caregiverProfile.id }
                },

                // Default Settings
                safeZones: {
                    create: { radiusLv1: 100, radiusLv2: 500, latitude: 13.7563, longitude: 100.5018 }
                },
                heartRateSetting: { create: { maxBpm: 120, minBpm: 50 } },
                tempSetting: { create: { maxTemperature: 37.5 } }
            }
        }
      },
    });

    revalidatePath('/admin/dependents');
    return { success: true };

  } catch (error) {
    console.error('Register Elderly Error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาด' };
  }
}