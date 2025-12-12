import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { AlertStatus } from '@prisma/client';
import { Client } from '@line/bot-sdk';
import { createCaseAcceptedBubble, createCaseClosedBubble, createCaregiverAlertBubble } from '@/lib/line/flex-messages';

const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // รับค่า action เพิ่มมา (accept หรือ close)
        const { action, alertId, name, phone, details } = body; 

        if (!alertId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const id = parseInt(alertId);
        const existingAlert = await prisma.extendedHelp.findUnique({
            where: { id: id },
            include: { dependent: { include: { caregiver: { include: { user: true } } } } }
        });

        if (!existingAlert) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // หา Group ID สำหรับส่งแจ้งเตือน
        const rescueGroup = await prisma.rescueGroup.findFirst({ orderBy: { createdAt: 'desc' } });
        const caregiverLineId = existingAlert.dependent?.caregiver?.user?.lineId;

        // ==========================================
        // 🟡 Case 1: กดรับงาน (ACCEPT)
        // ==========================================
        if (action === 'accept') {
            // เช็คว่ามีคนแย่งรับไปหรือยัง
            if (existingAlert.status !== AlertStatus.DETECTED) {
                 // ถ้าสถานะไม่ใช่ DETECTED แสดงว่ามีคนรับไปแล้ว (ACKNOWLEDGED) หรือปิดไปแล้ว (RESOLVED)
                 return NextResponse.json({ 
                     error: "Case already taken", 
                     takenBy: existingAlert.rescuerName 
                 }, { status: 409 });
            }

            const updated = await prisma.extendedHelp.update({
                where: { id },
                data: {
                    status: AlertStatus.ACKNOWLEDGED, // เปลี่ยนสถานะเป็น กำลังดำเนินการ
                    rescuerName: name,
                    rescuerPhone: phone
                }
            });

            // ส่ง Flex "รับทราบงาน" เข้ากลุ่ม
            const acceptBubble = createCaseAcceptedBubble(name, phone);
            if (rescueGroup) {
                await lineClient.pushMessage(rescueGroup.groupId, {
                    type: 'flex', altText: `🚑 รับเคสแล้วโดย ${name}`, contents: acceptBubble
                });
            }
            // ส่งหาผู้ดูแล
            if (caregiverLineId) {
                await lineClient.pushMessage(caregiverLineId, {
                    type: 'flex', altText: `🚑 รับเคสแล้วโดย ${name}`, contents: acceptBubble
                });
            }

            return NextResponse.json({ success: true, status: 'ACKNOWLEDGED' });
        }

        // ==========================================
        // 🟢 Case 2: ปิดงาน (CLOSE)
        // ==========================================
        if (action === 'close') {
            // อัปเดตรายละเอียดและปิดจอบ
            const updated = await prisma.extendedHelp.update({
                where: { id },
                data: {
                    status: AlertStatus.RESOLVED,
                    details: details, // บันทึกอาการ
                    resolvedAt: new Date()
                }
            });

            // ส่ง Flex "ปิดงาน"
            const closeBubble = createCaseClosedBubble(existingAlert.rescuerName!, details, updated.resolvedAt!);
            
            if (rescueGroup) {
                await lineClient.pushMessage(rescueGroup.groupId, {
                    type: 'flex', altText: `✅ ปิดเคสเรียบร้อย`, contents: closeBubble
                });
            }
            if (caregiverLineId) {
                await lineClient.pushMessage(caregiverLineId, {
                    type: 'flex', altText: `✅ ปิดเคสเรียบร้อย`, contents: closeBubble
                });
            }

            return NextResponse.json({ success: true, status: 'RESOLVED' });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}