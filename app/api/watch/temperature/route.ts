import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createGeneralAlertBubble, sendCriticalAlertFlexMessage } from '@/lib/line/flex-messages';
import { Client } from '@line/bot-sdk';

const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

async function handleRequest(request: Request) {
  try {
    const body = await request.json();
    
    const rawTemp = body.value || body.temperature_value || 0;
    const currentTemp = parseFloat(rawTemp);
    const targetId = body.uId || body.users_id || body.lineId;

    if (!targetId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // 🛑 ยันต์กันผี 0.0 หรือค่าเพี้ยนหลุดโลก
    if (currentTemp <= 0 || currentTemp > 50) {
        return NextResponse.json({ success: true, message: "Ignored invalid temp" });
    }

    // 1. ดึงข้อมูล User
    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { 
          dependentProfile: {
              include: {
                  caregiver: { include: { user: true } },
                  tempSetting: true,
                  // ดึงประวัติล่าสุดมาเช็ค Time Lock
                  temperatureRecords: { take: 1, orderBy: { timestamp: 'desc' } }
              }
          } 
      }
    });

    if (!user || !user.dependentProfile) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const dependent = user.dependentProfile;
    const maxTemp = dependent.tempSetting?.maxTemperature || 37.5; 
    
    // Recovery Buffer: ต้องลดลงต่ำกว่าเกณฑ์ 0.5 องศา ถึงจะยอมให้สถานะกลับเป็นปกติ (กันเด้งไปมา)
    const recoveryTemp = maxTemp - 0.5;

    // 2. Logic Status
    const isAlertSent = dependent.isTemperatureAlertSent;
    let isAbnormal = false;

    if (isAlertSent) {
        // ถ้าแจ้งเตือนอยู่.. จะหายได้ต้องต่ำกว่า recoveryTemp (เช่น ต่ำกว่า 37.0)
        isAbnormal = currentTemp >= recoveryTemp; 
    } else {
        // ถ้าปกติอยู่.. จะแจ้งเตือนเมื่อเกิน maxTemp (เช่น เกิน 37.5)
        isAbnormal = currentTemp > maxTemp;
    }

    const statusString = isAbnormal ? 'ABNORMAL' : 'NORMAL';

    // 3. ตัดสินใจว่าจะส่ง LINE ไหม?
    let shouldSendLine = false;
    let newAlertStatus = isAlertSent;
    let messageType = 'NONE';

    // เช็ค Time Lock (กัน Spam)
    const lastRecord = dependent.temperatureRecords[0];
    const now = new Date();
    let timeDiffSec = 9999;
    if (lastRecord) {
        timeDiffSec = (now.getTime() - new Date(lastRecord.timestamp).getTime()) / 1000;
    }

    if (isAbnormal) {
        // ขาขึ้น: แจ้งเตือนเมื่อยังไม่เคยแจ้ง
        if (!isAlertSent) {
            shouldSendLine = true;
            newAlertStatus = true;
            messageType = 'CRITICAL';
        } 
        // หรือถ้าแจ้งไปแล้ว แต่มันนานเกิน 1 ชั่วโมง (Remind)
        else if (timeDiffSec > 3600) {
             shouldSendLine = true;
             messageType = 'CRITICAL'; // เตือนซ้ำ
        }
    } else {
        // ขาลง: แจ้งเตือนเมื่อกลับมาปกติ
        if (isAlertSent) {
            shouldSendLine = true;
            newAlertStatus = false;
            messageType = 'RECOVERY';
        }
    }

    // 4. บันทึกข้อมูล (Save Record)
    // Optimization: บันทึกเฉพาะตอนสถานะเปลี่ยน หรือ ส่งไลน์ หรือนานๆ ที (ทุก 10 นาที) เพื่อประหยัด DB
    let record = null;
    let shouldSave = shouldSendLine || (timeDiffSec > 600); 

    if (shouldSave) {
        record = await prisma.temperatureRecord.create({
            data: {
                dependentId: dependent.id,
                value: currentTemp,
                status: statusString,
                timestamp: new Date(),
            }
        });
    } else {
        // ใช้ Record ล่าสุดที่มีแทน ถ้าไม่ได้สร้างใหม่
        record = lastRecord; 
    }

    // 5. ส่ง LINE
    if (shouldSendLine && dependent.caregiver?.user.lineId) {
        const lineId = dependent.caregiver.user.lineId;
        console.log(`🌡️ Temp Alert: ${messageType} (${currentTemp} °C)`);

        try {
            if (messageType === 'CRITICAL') {
                // ✅ แก้ Error: ใส่ Argument ให้ครบ (เพิ่ม notiText ตัวสุดท้าย)
                await sendCriticalAlertFlexMessage(
                    lineId,
                    record || { id: 0, timestamp: new Date() }, // กันเหนียวถ้า record null
                    user,
                    dependent.caregiver.phone || '',
                    dependent as any,
                    'TEMP', 
                    `⚠️ แจ้งเตือน: อุณหภูมิร่างกายสูง (${currentTemp.toFixed(1)} °C)` // ✅ ใส่ข้อความตรงนี้
                );
            } 
            else if (messageType === 'RECOVERY') {
                const msg = createGeneralAlertBubble(
                    "✅ อุณหภูมิร่างกายปกติ",
                    "อุณหภูมิลดลงอยู่ในเกณฑ์ปกติแล้ว",
                    `${currentTemp.toFixed(1)} °C`,
                    "#10B981", 
                    false 
                );
                await lineClient.pushMessage(lineId, { type: 'flex', altText: 'อุณหภูมิปกติแล้ว', contents: msg });
            }
        } catch (err) {
            console.error("LINE Send Error:", err);
        }
    }

    // 6. อัปเดต Flag
    if (newAlertStatus !== isAlertSent) {
        await prisma.dependentProfile.update({
            where: { id: dependent.id },
            data: { isTemperatureAlertSent: newAlertStatus }
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) { return handleRequest(req); }
export async function PUT(req: Request) { return handleRequest(req); }