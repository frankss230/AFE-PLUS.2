import prisma from '@/lib/db/prisma';

/**
 * 🎯 ค้นหา LINE ID ของ Caregiver ที่ดูแล Monitored User ID นั้นๆ
 * @param monitoredUserId ID ของผู้สูงอายุที่ล้ม
 */
export async function getCaregiverRecipientId(monitoredUserId: number): Promise<string | null> {
    
    // 1. ค้นหา Caregiver record ที่ผูกกับ Monitored User ID
    const caregiverLink = await prisma.caregiver.findFirst({
        where: {
            userId: monitoredUserId, 
        },
        select: {
            // ดึง field ใหม่ที่เพิ่งสร้างใน schema.prisma
            caregiverUserId: true, 
        }
    });

    // 2. ถ้าหา Caregiver Link ไม่เจอ (หรือไม่มี Account ผู้ดูแลผูกไว้)
    if (!caregiverLink || !caregiverLink.caregiverUserId) {
        console.warn(`⚠️ Caregiver link not found for monitored user ID: ${monitoredUserId}. Falling back to Admin.`);
        
        // 🚨 Fallback: กลับไปหา Admin (statusId = 1) เพื่อให้แน่ใจว่า Alert ถูกส่งออกไป
        const adminUser = await prisma.user.findFirst({
            where: {
                statusId: 1, // Admin (statusId=1)
                lineId: { not: null }
            },
            select: { lineId: true }
        });
        return adminUser?.lineId || null;
    }

    // 3. ใช้ Caregiver's User ID ที่เจอ ไปหา LINE ID ในตาราง User
    const recipientUser = await prisma.user.findUnique({
        where: {
            id: caregiverLink.caregiverUserId, 
        },
        select: { lineId: true }
    });

    return recipientUser?.lineId || null;
}