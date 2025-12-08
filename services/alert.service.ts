import prisma from '@/lib/db/prisma';
import { Client } from '@line/bot-sdk';
import { createGeneralAlertBubble } from '@/lib/line/flex-messages';

const lineClient = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

type AlertType = 'safezone' | 'heartrate' | 'temperature' | 'battery';

// -----------------------------------------
// 📨 ฟังก์ชันส่ง Alert (Updated for New Schema)
// -----------------------------------------
export async function createAlert(data: {
  type: AlertType;
  dependentId: number; // เปลี่ยนจาก caregiverId เป็น dependentId ให้สื่อความหมาย
  message: string;
  valueString?: string;
  color?: string;
}) {
  try {
    // 1. ดึงข้อมูล Dependent -> Caregiver -> User (LineID)
    const dependent = await prisma.dependentProfile.findUnique({
      where: { id: data.dependentId },
      include: {
        caregiver: { // ผู้ดูแล
            include: { user: { select: { lineId: true } } } // เอา LineID จาก User ของผู้ดูแล
        }
      }
    });

    // เช็คว่ามีข้อมูลครบไหม
    if (!dependent || !dependent.caregiver || !dependent.caregiver.user.lineId) {
        console.warn(`⚠️ Alert skipped: No Line ID found for Dependent ID ${data.dependentId}`);
        return;
    }

    const recipientLineId = dependent.caregiver.user.lineId;
    const elderlyName = `คุณ${dependent.firstName} ${dependent.lastName}`;

    // 2. สร้าง Flex Message
    const flexMessage = createGeneralAlertBubble(
        "แจ้งเตือน",
        `${data.message} (ผู้สูงอายุ: ${elderlyName})`,
        data.valueString || "-",
        data.color || "#3B82F6"
    );

    // 3. ส่ง LINE
    await lineClient.pushMessage(recipientLineId, {
        type: 'flex',
        altText: `⚠️ แจ้งเตือน: ${data.message}`,
        contents: flexMessage
    });

    console.log(`✅ Alert sent for ${elderlyName}: ${data.message}`);
    return { success: true };

  } catch (error) {
    console.error("Create Alert Error:", error);
    return { success: false, error };
  }
}

// ====================================================================
// 🔥 Smart Alert Logic (Updated for New Schema)
// ====================================================================

// 1. Safezone Check
export async function checkSafezoneAlert(dependentId: number, distance: number) {
  if (distance <= 0 || distance > 5000000) return;

  // ดึง Setting (Safezone) และ สถานะ (DependentProfile)
  // *หมายเหตุ: ใน Schema ใหม่ Safezone ผูกกับ DependentProfile (dependentId)
  const safezone = await prisma.safeZone.findFirst({ where: { dependentId } });
  const dependent = await prisma.dependentProfile.findUnique({ where: { id: dependentId } });
  
  if (!safezone || !dependent) return;

  const isDanger = (safezone.radiusLv2 > 0 && distance > safezone.radiusLv2) || 
                   (safezone.radiusLv1 > 0 && distance > safezone.radiusLv1);

  if (isDanger) {
      // 🔴 ถ้าอันตราย และ ยังไม่ได้แจ้ง -> แจ้งเลย!
      if (!dependent.isSafezoneAlertSent) {
          await createAlert({
            type: 'safezone',
            dependentId,
            message: `ออกนอกเขตปลอดภัย! (${distance} ม.)`,
            valueString: `${distance} เมตร`,
            color: "#EF4444"
          });
          await prisma.dependentProfile.update({ where: { id: dependentId }, data: { isSafezoneAlertSent: true } });
      }
  } else {
      // 🟢 ถ้าปกติแล้ว และ เคยแจ้งไป -> บอกว่ากลับมาแล้ว
      if (dependent.isSafezoneAlertSent) {
          await createAlert({
            type: 'safezone',
            dependentId,
            message: `กลับเข้าสู่เขตปลอดภัยแล้ว`,
            valueString: `${distance} เมตร`,
            color: "#10B981" // สีเขียว
          });
          await prisma.dependentProfile.update({ where: { id: dependentId }, data: { isSafezoneAlertSent: false } });
      }
  }
}

// 2. Heart Rate Check
export async function checkHeartRateAlert(dependentId: number, bpm: number) {
  if (bpm <= 40 || bpm > 220) return;

  const settings = await prisma.heartRateSettings.findUnique({ where: { dependentId } });
  const dependent = await prisma.dependentProfile.findUnique({ where: { id: dependentId } });

  if (!settings || !dependent) return;

  const isDanger = bpm > settings.maxBpm || bpm < settings.minBpm;

  if (isDanger) {
      if (!dependent.isHeartRateAlertSent) {
          await createAlert({
            type: 'heartrate',
            dependentId,
            message: `ชีพจรผิดปกติ! (${bpm} bpm)`,
            valueString: `${bpm} bpm`,
            color: "#EF4444"
          });
          await prisma.dependentProfile.update({ where: { id: dependentId }, data: { isHeartRateAlertSent: true } });
      }
  } else {
      if (dependent.isHeartRateAlertSent) {
          await createAlert({
            type: 'heartrate',
            dependentId,
            message: `ชีพจรกลับสู่ภาวะปกติ`,
            valueString: `${bpm} bpm`,
            color: "#10B981"
          });
          await prisma.dependentProfile.update({ where: { id: dependentId }, data: { isHeartRateAlertSent: false } });
      }
  }
}

// 3. Temp Check
export async function checkTemperatureAlert(dependentId: number, value: number) {
  if (value <= 30 || value > 45) return;

  const settings = await prisma.temperatureSettings.findUnique({ where: { dependentId } });
  const dependent = await prisma.dependentProfile.findUnique({ where: { id: dependentId } });

  if (!settings || !dependent) return;

  const isDanger = value > settings.maxTemperature;

  if (isDanger) {
      if (!dependent.isTemperatureAlertSent) {
          await createAlert({
            type: 'temperature',
            dependentId,
            message: `อุณหภูมิสูงเกินเกณฑ์! (${value.toFixed(1)}°C)`,
            valueString: `${value.toFixed(1)} °C`,
            color: "#F97316"
          });
          await prisma.dependentProfile.update({ where: { id: dependentId }, data: { isTemperatureAlertSent: true } });
      }
  } else {
      if (dependent.isTemperatureAlertSent) {
          await createAlert({
            type: 'temperature',
            dependentId,
            message: `อุณหภูมิกลับสู่ปกติ`,
            valueString: `${value.toFixed(1)} °C`,
            color: "#10B981"
          });
          await prisma.dependentProfile.update({ where: { id: dependentId }, data: { isTemperatureAlertSent: false } });
      }
  }
}