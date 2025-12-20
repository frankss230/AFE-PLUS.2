import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
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

    // 🛑 กฏเหล็ก: ถ้าค่าเป็น 0 หรือน้อยกว่า (Sensor ยังไม่ทำงาน) หรือค่าหลุดโลก (เกิน 250) -> จบเลย
    if (bpm <= 0 || bpm > 250) {
        return NextResponse.json({ success: true, message: "Ignored invalid bpm" });
    }

    // 1. ดึงข้อมูล User
    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { 
          dependentProfile: {
              include: {
                  caregiver: { include: { user: true } },
                  heartRateSetting: true,
                  // ✅ ดึง Record ล่าสุดมาเช็คเวลา (Time Lock)
                  heartRateRecords: { take: 1, orderBy: { timestamp: 'desc' } },
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

    // 2. Logic Alert with Buffer (ป้องกันการแกว่ง) 🛡️
    // ต้องให้หัวใจกลับมาปกติเกิน 5 BPM ถึงจะยอมให้สถานะหาย (Hysteresis)
    const buffer = 5; 
    const isAlertSent = dependent.isHeartRateAlertSent; 
    let isAbnormal = false;

    if (isAlertSent) {
        // ถ้าแจ้งเตือนอยู่... จะหายได้ต้องกลับมาอยู่ในโซนปลอดภัยจริงๆ
        // คือต้องมากกว่า (Min + 5) และ น้อยกว่า (Max - 5)
        const isRecovered = (bpm > (minVal + buffer)) && (bpm < (maxVal - buffer));
        isAbnormal = !isRecovered;
    } else {
        // ถ้าปกติอยู่... จะแจ้งเตือนเมื่อหลุดเกณฑ์
        isAbnormal = (bpm < minVal || bpm > maxVal);
    }

    const statusString = isAbnormal ? 'ABNORMAL' : 'NORMAL';

    // 3. ตัดสินใจว่าจะส่ง LINE ไหม?
    let shouldSendLine = false;
    let newAlertStatus = isAlertSent;
    let messageType = 'NONE';

    // เช็ค Time Lock (กัน Spam)
    const lastRecord = dependent.heartRateRecords[0];
    const now = new Date();
    let timeDiffSec = 9999;
    if (lastRecord) {
        timeDiffSec = (now.getTime() - new Date(lastRecord.timestamp).getTime()) / 1000;
    }

    if (isAbnormal) {
        // ขาขึ้น: ยังไม่เคยแจ้ง -> แจ้ง
        if (!isAlertSent) {
            shouldSendLine = true;
            newAlertStatus = true;
            messageType = 'CRITICAL';
        }
        // หรือแจ้งไปแล้ว แต่นานเกิน 30 นาทีแล้ว (Remind)
        else if (timeDiffSec > 1800) {
            shouldSendLine = true;
            messageType = 'CRITICAL';
        }
    } else {
        // ขาลง: กลับมาปกติ
        if (isAlertSent) {
            shouldSendLine = true;
            newAlertStatus = false;
            messageType = 'RECOVERY';
        }
    }

    // 4. บันทึก Record (Optimization) 💾
    // บันทึกเมื่อ: สถานะเปลี่ยน OR ส่งไลน์ OR นานๆที (ทุก 10 นาที)
    let record = null;
    let shouldSave = shouldSendLine || (timeDiffSec > 600);

    if (shouldSave) {
        record = await prisma.heartRateRecord.create({
            data: {
              dependentId: dependent.id,
              bpm: bpm,
              status: statusString,
              timestamp: new Date(),
            },
        });
    } else {
        record = lastRecord; // ใช้ตัวเก่าแทนถ้าไม่ได้สร้างใหม่
    }

    // 5. ส่ง LINE
    if (shouldSendLine && dependent.caregiver?.user.lineId) {
        const lineId = dependent.caregiver.user.lineId;
        console.log(`💓 HeartRate Alert: ${messageType} (${bpm} bpm)`);

        try {
            if (messageType === 'CRITICAL') {
                // ✅ ใส่ Argument ให้ครบ (เพิ่ม notiText)
                await sendCriticalAlertFlexMessage(
                    lineId,
                    record || { id: 0, timestamp: new Date() }, // กันเหนียว
                    user,
                    dependent.caregiver.phone || '',
                    dependent as any,
                    'HEART', 
                    `⚠️ แจ้งเตือน: ชีพจรผิดปกติ (${bpm} bpm)` // ✅ ใส่ข้อความแจ้งเตือนตรงนี้
                );
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
        } catch (err) {
            console.error("LINE Send Error:", err);
        }
    }

    // อัปเดตสถานะ Alert Flag
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