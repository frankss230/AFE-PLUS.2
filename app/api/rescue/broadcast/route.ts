import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createRescueGroupFlexMessage, createRescueSuccessBubble } from '@/lib/line/flex-messages';
import { Client } from '@line/bot-sdk';
import { AlertStatus, HelpType, UserRole } from '@prisma/client'; 

const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // ✅ 1. รับค่าต่างๆ
        const { userId, latitude: clientLat, longitude: clientLng, message, recordId, alertType } = body; 

        console.log("🔍 SOS Request Incoming:", { userId, alertType, recordId });

        if (!userId) return NextResponse.json({ error: "User ID missing" }, { status: 400 });

        // 2. หา User จาก Line ID
        const user = await prisma.user.findUnique({
            where: { lineId: userId }, 
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let dependentId: number | null = null;
        let reporterId: number | null = null;
        let dependentInfo = null;
        let caregiverInfo = null;

        // --- Step 1: ระบุตัวตน (Dependent หรือ Caregiver) ---
        if (user.role === UserRole.DEPENDENT) {
            const depProfile = await prisma.dependentProfile.findUnique({
                where: { userId: user.id },
                include: { caregiver: { include: { user: true } }, user: true }
            });
            if (!depProfile || !depProfile.caregiverId) return NextResponse.json({ error: "Profile/Caregiver Error" }, { status: 400 });

            dependentId = depProfile.id;
            reporterId = depProfile.caregiverId; 
            dependentInfo = depProfile;
            caregiverInfo = depProfile.caregiver;

        } else if (user.role === UserRole.CAREGIVER || user.role === UserRole.ADMIN) {
             const cgProfile = await prisma.caregiverProfile.findUnique({
                where: { userId: user.id },
                include: { dependents: { include: { user: true } }, user: true }
             });
             if (!cgProfile || cgProfile.dependents.length === 0) return NextResponse.json({ error: "No dependents found for this caregiver" }, { status: 400 });

             const targetDependent = cgProfile.dependents[0]; 
             dependentId = targetDependent.id;
             reporterId = cgProfile.id; 
             dependentInfo = { ...targetDependent, caregiver: cgProfile };
             caregiverInfo = cgProfile;
        } else {
             return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
        }

        // --- Step 2: 📍 จัดการพิกัด (Priority: นาฬิกา > มือถือคนแจ้ง) ---
        let finalLat = 0;
        let finalLng = 0;

        const lastLocation = await prisma.location.findFirst({
            where: { dependentId: dependentId },
            orderBy: { timestamp: 'desc' } 
        });

        if (lastLocation) {
            console.log("📍 ใช้พิกัดจากนาฬิกา (DB)");
            finalLat = lastLocation.latitude;
            finalLng = lastLocation.longitude;
        } else {
            console.log("⚠️ ไม่พบพิกัดนาฬิกา ใช้พิกัดจากผู้แจ้ง");
            finalLat = clientLat || 0;
            finalLng = clientLng || 0;
        }

        // --- Step 3: 📝 ข้อความรายละเอียด ---
        let detailsText = message || "ขอความช่วยเหลือ";

        // --- Step 4: 🔀 Mapping Enum (เอา FALL_SOS ออกแล้ว) ---
        let dbHelpType: HelpType = HelpType.ZONE; // Default

        // แปลง String เป็น Enum ของ Prisma
        if (alertType === 'FALL' || alertType === 'FALL_CONSCIOUS') {
            dbHelpType = HelpType.FALL_CONSCIOUS;
        } else if (alertType === 'FALL_UNCONSCIOUS') {
            dbHelpType = HelpType.FALL_UNCONSCIOUS;
        } else if (alertType === 'HEART' || alertType === 'HEART_RATE') {
            dbHelpType = HelpType.HEART_RATE;
        } else if (alertType === 'TEMP' || alertType === 'TEMPERATURE') {
            dbHelpType = HelpType.TEMPERATURE;
        } else if (alertType === 'ZONE') {
            dbHelpType = HelpType.ZONE;
        }
        
        // --- Step 5: บันทึกลงฐานข้อมูล ---
        const newAlert = await prisma.extendedHelp.create({
            data: {
                status: AlertStatus.DETECTED,
                type: dbHelpType,
                dependentId: dependentId!,
                reporterId: reporterId!,          
                latitude: finalLat,   
                longitude: finalLng,
                details: detailsText
            },
            include: {
                dependent: { include: { user: true } },
                reporter: { include: { user: true } }
            }
        });

        // --- Step 6: 🔄 อัปเดตเคสต้นทาง (ถ้ามี) ---
        if (recordId) {
            const idToUpdate = parseInt(recordId);
            if (!isNaN(idToUpdate)) {
                if (dbHelpType === HelpType.FALL_CONSCIOUS || dbHelpType === HelpType.FALL_UNCONSCIOUS) {
                    try {
                        await prisma.fallRecord.update({
                            where: { id: idToUpdate },
                            data: { status: 'ACKNOWLEDGED' }
                        });
                        console.log(`✅ Updated FallRecord #${idToUpdate}`);
                    } catch (err) {
                        console.warn("⚠️ FallRecord update failed:", err);
                    }
                }
            }
        }

        // --- Step 7: 🚑 ส่ง LINE เข้ากลุ่มกู้ภัย ---
        const rescueGroup = await prisma.rescueGroup.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        
        const targetGroupId = rescueGroup?.groupId;

        if (targetGroupId && dependentInfo) {
            let alertTitle = "ขอความช่วยเหลือด่วน";
            if (dbHelpType === HelpType.FALL_CONSCIOUS) alertTitle = "แจ้งเหตุการล้ม";
            else if (dbHelpType === HelpType.FALL_UNCONSCIOUS) alertTitle = "แจ้งเหตุการล้มไม่ตอบสนอง";
            else if (dbHelpType === HelpType.HEART_RATE) alertTitle = "สัญญาณชีพผิดปกติ";
            else if (dbHelpType === HelpType.TEMPERATURE) alertTitle = "อุณหภูมิร่างกายวิกฤต";
            else if (dbHelpType === HelpType.ZONE) alertTitle = "แจ้งเตือนออกนอกพื้นที่";

            const flexMsg = createRescueGroupFlexMessage(
                newAlert.id,
                newAlert,
                dependentInfo.user,
                caregiverInfo!, 
                dependentInfo,
                alertTitle
            );

            await lineClient.pushMessage(targetGroupId, {
                type: 'flex',
                altText: `${alertTitle}: ${dependentInfo.user.username}`,
                contents: flexMsg as any 
            });
            console.log(`✅ Broadcast sent to Group: ${targetGroupId}`);
        }

        // --- Step 8: ✅ แจ้งกลับคนกด ---
        const successBubble = createRescueSuccessBubble(); 
        
        await lineClient.pushMessage(userId, {
            type: 'flex',
            altText: 'รับแจ้งเหตุแล้ว เจ้าหน้าที่กำลังตรวจสอบ',
            contents: successBubble
        });

        return NextResponse.json({ success: true, alertId: newAlert.id });

    } catch (e) {
        console.error("❌ BROADCAST ERROR:", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}