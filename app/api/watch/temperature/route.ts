import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createGeneralAlertBubble } from '@/lib/line/flex-messages';
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

    // 🛑 ยันต์กันผี 0.0 (ถ้าค่าเป็น 0 ให้ข้ามไปเลย)
    if (currentTemp <= 0) {
        return NextResponse.json({ success: true, message: "Ignored 0.0 temp" });
    }

    // 1. ดึงข้อมูล User, Setting และ Locations
    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { 
          dependentProfile: {
              include: {
                  caregiver: { include: { user: true } },
                  tempSetting: true,
                  locations: { take: 1, orderBy: { timestamp: 'desc' } }
              }
          } 
      }
    });

    if (!user || !user.dependentProfile) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const dependent = user.dependentProfile;
    const maxTemp = dependent.tempSetting?.maxTemperature || 37.5; 

    // 2. Logic
    const isAbnormal = (currentTemp > maxTemp);
    const isAlertSent = dependent.isTemperatureAlertSent;
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
        console.log(`🌡️ Temp Alert: ${messageType} (${currentTemp} °C)`);

        if (messageType === 'CRITICAL') {
            // ⭐⭐⭐ แก้ตรงนี้! ใช้ createGeneralAlertBubble แทน ⭐⭐⭐
            // จะได้ใส่ตัวเลขที่หัวข้อรองได้ชัดเจน
            const msg = createGeneralAlertBubble(
                "🔥 อุณหภูมิสูงผิดปกติ", // หัวข้อหลัก (สีส้ม)
                `ตรวจพบอุณหภูมิ ${currentTemp.toFixed(1)} °C (เกินเกณฑ์ ${maxTemp} °C)`, // ✅ หัวข้อรอง (ใส่เลขตรงนี้!)
                "กรุณาตรวจสอบผู้ป่วยทันที", // เนื้อหา
                "#F97316", // สีส้ม
                true // ✅ isEmergency = true (ให้มีปุ่ม 1669)
            );
            await lineClient.pushMessage(lineId, { type: 'flex', altText: 'แจ้งเตือนอุณหภูมิสูง', contents: msg });
        } 
        else if (messageType === 'RECOVERY') {
            // (ส่วนสีเขียวเหมือนเดิม)
            const msg = createGeneralAlertBubble(
                "✅ อุณหภูมิร่างกายปกติ",
                "อุณหภูมิลดลงอยู่ในเกณฑ์ปกติแล้ว",
                `${currentTemp.toFixed(1)} °C`,
                "#10B981", 
                false 
            );
            await lineClient.pushMessage(lineId, { type: 'flex', altText: 'อุณหภูมิปกติแล้ว', contents: msg });
        }
    }

    // 4. บันทึก & อัปเดต Flag (เหมือนเดิม)
    const record = await prisma.temperatureRecord.create({
        data: {
            dependentId: dependent.id,
            value: currentTemp,
            status: isAbnormal ? 'ABNORMAL' : 'NORMAL',
            timestamp: new Date(),
        }
    });

    if (newAlertStatus !== isAlertSent) {
        await prisma.dependentProfile.update({
            where: { id: dependent.id },
            data: { isTemperatureAlertSent: newAlertStatus }
        });
    }

    return NextResponse.json({ success: true, data: record });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) { return handleRequest(req); }
export async function PUT(req: Request) { return handleRequest(req); }