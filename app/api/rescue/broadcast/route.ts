import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
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
        const { userId, latitude: clientLat, longitude: clientLng, message } = body; 

        console.log("🔍 LIFF UserID:", userId);

        if (!userId) return NextResponse.json({ error: "User ID missing" }, { status: 400 });

        // 1. หา User
        const user = await prisma.user.findUnique({
            where: { lineId: userId }, 
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let dependentId: number | null = null;
        let reporterId: number | null = null;
        let dependentInfo = null;
        let caregiverInfo = null;

        // --- Step 1: ระบุตัวตน ---
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
             if (!cgProfile || cgProfile.dependents.length === 0) return NextResponse.json({ error: "No dependents found" }, { status: 400 });

             const targetDependent = cgProfile.dependents[0]; 
             dependentId = targetDependent.id;
             reporterId = cgProfile.id; 
             dependentInfo = { ...targetDependent, caregiver: cgProfile };
             caregiverInfo = cgProfile;
        } else {
             return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // --- Step 2: 🟢 หาพิกัดล่าสุดจาก Database ---
        let finalLat = clientLat;
        let finalLng = clientLng;

        if (dependentId) {
            const lastLocation = await prisma.location.findFirst({
                where: { dependentId: dependentId },
                orderBy: { timestamp: 'desc' } 
            });

            if (lastLocation) {
                finalLat = lastLocation.latitude;
                finalLng = lastLocation.longitude;
            }
        }

        // --- Step 3: สร้าง Alert ---
        const newAlert = await prisma.extendedHelp.create({
            data: {
                status: AlertStatus.DETECTED,
                type: HelpType.LINE_SOS,      
                dependentId: dependentId!,
                reporterId: reporterId!,          
                latitude: finalLat || null,   
                longitude: finalLng || null   
            },
            include: {
                dependent: { include: { user: true } },
                reporter: { include: { user: true } }
            }
        });

        // --- Step 4: ส่ง LINE เข้ากลุ่มกู้ภัย ---
        const rescueGroup = await prisma.rescueGroup.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        
        const targetGroupId = rescueGroup?.groupId;

        if (targetGroupId && dependentInfo) {
            const alertTitle = message || "🆘 ขอความช่วยเหลือด่วน";
            
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
                altText: `🚨 ${alertTitle}: ${dependentInfo.user.username}`,
                contents: flexMsg as any 
            });
            console.log(`✅ ส่งแจ้งเตือนไปยังกลุ่ม ${targetGroupId} สำเร็จ`);
        }

        // --- ⭐ Step 5: แจ้งกลับไปหา "คนกด" (ผู้ดูแล) เป็น Flex Message ---
        const successBubble = createRescueSuccessBubble(); // สร้าง Flex
        
        await lineClient.pushMessage(userId, {
            type: 'flex',
            altText: '✅ แจ้งเหตุสำเร็จ! เจ้าหน้าที่กำลังตรวจสอบ',
            contents: successBubble
        });

        console.log(`📩 แจ้งยืนยันกลับไปหาคนกด (${userId}) สำเร็จ`);

        return NextResponse.json({ success: true, alertId: newAlert.id });

    } catch (e) {
        console.error("❌ ERROR:", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}