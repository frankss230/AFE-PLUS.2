'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db/prisma';

export async function getElderlySafetySettings(lineId: string) {
  try {
    const caregiverUser = await prisma.user.findFirst({
      where: { lineId: lineId },
      include: {
        caregiverProfile: {
          include: {
            dependents: {
                include: {
                    safeZones: true,
                    tempSetting: true,
                    heartRateSetting: true
                }
            }
          }
        }
      }
    });

    if (!caregiverUser || !caregiverUser.caregiverProfile || caregiverUser.caregiverProfile.dependents.length === 0) {
        return { success: false, error: 'ไม่พบข้อมูลผู้ที่มีภาวะพึ่งพิง' };
    }

    const dependent = caregiverUser.caregiverProfile.dependents[0];

    return {
        success: true,
        data: {
            name: `${dependent.firstName} ${dependent.lastName}`,
            safezone: dependent.safeZones[0] || { radiusLv1: 100, radiusLv2: 500, latitude: 13.7563, longitude: 100.5018 },
            tempSetting: dependent.tempSetting || { maxTemperature: 37.5 },
            heartSetting: dependent.heartRateSetting || { maxBpm: 120 },
            isGpsEnabled: dependent.isGpsEnabled
        }
    };

  } catch (error) {
    console.error("Get Settings Error:", error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' };
  }
}

export async function updateSafezone(
    lineId: string, 
    lv1: number, 
    lv2: number, 
    lat: number, 
    lng: number,
    isGpsOn: boolean
) {
    try {
        const caregiverUser = await prisma.user.findFirst({
            where: { lineId },
            include: { caregiverProfile: { include: { dependents: true } } }
        });

        if (!caregiverUser?.caregiverProfile?.dependents[0]) return { success: false, error: 'Dependent not found' };
        
        const dependentId = caregiverUser.caregiverProfile.dependents[0].id;

        await prisma.dependentProfile.update({
            where: { id: dependentId },
            data: { 
                isGpsEnabled: isGpsOn,
            }
        });

        const existing = await prisma.safeZone.findFirst({ where: { dependentId } });

        if (existing) {
            await prisma.safeZone.update({
                where: { id: existing.id },
                data: {
                    radiusLv1: lv1,
                    radiusLv2: lv2,
                    latitude: lat,
                    longitude: lng
                }
            });
        } else {
            await prisma.safeZone.create({
                data: {
                    dependentId: dependentId,
                    radiusLv1: lv1,
                    radiusLv2: lv2,
                    latitude: lat,
                    longitude: lng
                }
            });
        }

        revalidatePath('/safety-settings');
        return { success: true };
    } catch (e) { return { success: false, error: 'Update Failed' }; }
}




export async function updateTemperature(lineId: string, maxTemp: number) {
    try {
        const caregiverUser = await prisma.user.findFirst({
            where: { lineId },
            include: { caregiverProfile: { include: { dependents: true } } }
        });
        
        if (!caregiverUser?.caregiverProfile?.dependents[0]) return { success: false, error: 'Dependent not found' };
        const dependentId = caregiverUser.caregiverProfile.dependents[0].id;

        await prisma.temperatureSettings.upsert({
            where: { dependentId: dependentId },
            create: { dependentId: dependentId, maxTemperature: maxTemp },
            update: { maxTemperature: maxTemp }
        });

        return { success: true };
    } catch (e) { return { success: false, error: 'Update Failed' }; }
}

export async function updateHeartrate(lineId: string, maxBpm: number) {
    try {
        const caregiverUser = await prisma.user.findFirst({
            where: { lineId },
            include: { caregiverProfile: { include: { dependents: true } } }
        });
        
        if (!caregiverUser?.caregiverProfile?.dependents[0]) return { success: false, error: 'Dependent not found' };
        const dependentId = caregiverUser.caregiverProfile.dependents[0].id;

        await prisma.heartRateSettings.upsert({
            where: { dependentId: dependentId },
            create: { dependentId: dependentId, maxBpm: maxBpm },
            update: { maxBpm: maxBpm }
        });

        return { success: true };
    } catch (e) { return { success: false, error: 'Update Failed' }; }
}

export async function toggleGpsMode(lineId: string, isEnabled: boolean) {
    try {
        const caregiverUser = await prisma.user.findFirst({
            where: { lineId },
            include: { caregiverProfile: { include: { dependents: true } } }
        });
        
        if (!caregiverUser?.caregiverProfile?.dependents[0]) {
            return { success: false, error: 'User not found' };
        }

        const updateData: any = { isGpsEnabled: isEnabled };

        await prisma.dependentProfile.update({
            where: { id: caregiverUser.caregiverProfile.dependents[0].id },
            data: updateData,
        });

        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed to toggle GPS' };
    }
}