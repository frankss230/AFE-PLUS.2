import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendCriticalAlertFlexMessage, createGeneralAlertBubble } from '@/lib/line/flex-messages';
import { Client } from '@line/bot-sdk';

const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

async function handleRequest(request: Request) {
  try {
    const body = await request.json();
    const targetId = body.uId || body.lineId || body.users_id;
    const bpm = parseInt(body.bpm || 0);

    if (!targetId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // 🛑 กฏเหล็ก: ถ้าค่าเป็น 0 หรือน้อยกว่า (Sensor ยังไม่ทำงาน) -> จบเลย ห้ามทำต่อ
    if (bpm <= 0) {
        return NextResponse.json({ success: true, message: "Ignored 0 bpm" });
    }

    // 1. ดึงข้อมูล User
    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { 
          dependentProfile: {
              include: {
                  caregiver: { include: { user: true } },
                  heartRateSetting: true,
                  locations: { take: 1, orderBy: { timestamp: 'desc' } } 
              }
          } 
      }
    });

    if (!user || !user.dependentProfile) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const dependent = user.dependentProfile;
    const settings = dependent.heartRateSetting;
    
    const minVal = settings?.minBpm || 60;
    const maxVal = settings?.maxBpm || 100;

    // 2. Logic Alert
    const isAbnormal = (bpm < minVal || bpm > maxVal);
    const isAlertSent = dependent.isHeartRateAlertSent; 

    let shouldSendLine = false;
    let newAlertStatus = isAlertSent;
    let messageType = 'NONE';

    if (isAbnormal) {
        if (!isAlertSent) {
            shouldSendLine = true;
            newAlertStatus = true;
            messageType = 'CRITICAL';
        }
    } else {
        if (isAlertSent) {
            shouldSendLine = true;
            newAlertStatus = false;
            messageType = 'RECOVERY';
        }
    }

    // 3. ส่ง LINE
    if (shouldSendLine && dependent.caregiver?.user.lineId) {
        const lineId = dependent.caregiver.user.lineId;
        console.log(`💓 HeartRate Alert: ${messageType} (${bpm} bpm)`);

        if (messageType === 'CRITICAL') {
            // 🚨 แก้ไข: ใช้การ์ดแบบ GeneralAlert สีส้ม เพื่อให้โชว์ตัวเลขชัดเจน
            // (เพราะการ์ด CriticalAlertFlexMessage อาจจะไม่ได้ออกแบบมาให้โชว์ตัวเลข BPM ในบางเวอร์ชั่น)
            const msg = createGeneralAlertBubble(
                "💓 อัตราการเต้นหัวใจผิดปกติ",
                `ค่าอยู่นอกเกณฑ์ที่กำหนด (${minVal}-${maxVal} bpm)`,
                `${bpm} bpm`, // ✅ โชว์เลขตรงนี้ชัดๆ
                "#F97316", // สีส้ม
                true // ✅ มีปุ่ม 1669
            );
            await lineClient.pushMessage(lineId, { type: 'flex', altText: 'แจ้งเตือนชีพจรผิดปกติ', contents: msg });
        } 
        else if (messageType === 'RECOVERY') {
            const msg = createGeneralAlertBubble(
                "✅ อัตราการเต้นหัวใจปกติ",
                `ค่ากลับมาอยู่ในเกณฑ์ปกติแล้ว (${minVal}-${maxVal})`,
                `${bpm} bpm`,
                "#10B981", 
                false
            );
            await lineClient.pushMessage(lineId, { type: 'flex', altText: 'หัวใจปกติแล้ว', contents: msg });
        }
    }

    // 4. บันทึก & อัปเดต
    const record = await prisma.heartRateRecord.create({
      data: {
        dependentId: dependent.id,
        bpm: bpm,
        status: isAbnormal ? 'ABNORMAL' : 'NORMAL',
        timestamp: new Date(),
      },
    });

    if (newAlertStatus !== isAlertSent) {
        await prisma.dependentProfile.update({
            where: { id: dependent.id },
            data: { isHeartRateAlertSent: newAlertStatus }
        });
    }

    return NextResponse.json({ success: true, data: record });

  } catch (e) { 
      console.error(e);
      return NextResponse.json({ error: 'Error' }, { status: 500 }); 
  }
}

export async function POST(req: Request) { return handleRequest(req); }
export async function PUT(req: Request) { return handleRequest(req); }