import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  sendCriticalAlertFlexMessage,
  createGeneralAlertBubble,
} from "@/lib/line/flex-messages";
import { Client } from "@line/bot-sdk";
import { pushStatusMessage } from "@/app/api/webhook/line/route";

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
});

export const dynamic = 'force-dynamic';

async function handleRequest(request: Request) {
  try {
    const body = await request.json();

    // 1. รับค่า
    const targetId = body.uId || body.lineId || body.users_id;
    const { battery, distance, status } = body;
    let rawLat = body.latitude ?? body.lat ?? 0;
    let rawLng = body.longitude ?? body.lng ?? 0;
    const lat = parseFloat(String(rawLat));
    const lng = parseFloat(String(rawLng));

    if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) {
      return NextResponse.json({ success: true, message: "Ignored 0,0" });
    }

    if (!targetId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // 2. ดึงข้อมูล
    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: {
        dependentProfile: {
          include: {
            caregiver: { include: { user: true } },
            locations: { take: 1, orderBy: { timestamp: "desc" } }, 
            safeZones: { take: 1 },
          },
        },
      },
    });

    if (!user || !user.dependentProfile) {
      return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 });
    }

    const dependent = user.dependentProfile;
    const caregiver = dependent.caregiver;
    const safeZoneData = dependent.safeZones[0];
    const waitViewLocation = dependent.waitViewLocation ?? false;
    
    // Flag สถานะ
    let { isAlertZone1Sent, isAlertNearZone2Sent, isAlertZone2Sent } = dependent;

    const statusInt = parseInt(status);
    const distInt = parseInt(distance || 0);

    if (statusInt === 0 && distInt === 0) {
      return NextResponse.json({ success: true, message: "Glitch Skipped" });
    }

    const r1 = safeZoneData?.radiusLv1 || 100;
    const r2 = safeZoneData?.radiusLv2 || 500;
    
    // Logic แยก SOS vs Zone
    const isDistanceCritical = distInt >= r2; 
    const isManualSOS = (statusInt === 2) && !isDistanceCritical;

    let currentDBStatus: "SAFE" | "WARNING" | "DANGER" = "SAFE";
    let shouldSendLine = false;
    let alertType = "NONE";

    // ==========================================
    // 🚨 CASE 1: MANUAL SOS (กดปุ่ม)
    // ==========================================
    if (isManualSOS) {
        console.log("🚨 Manual SOS Detected!");
        currentDBStatus = "DANGER";
        const recentSOS = await prisma.extendedHelp.findFirst({
            where: { dependentId: dependent.id, type: "WATCH_SOS", requestedAt: { gte: new Date(Date.now() - 60000) } }
        });

        if (!recentSOS && caregiver?.user.lineId) {
             await sendCriticalAlertFlexMessage(
              caregiver.user.lineId,
              { latitude: lat, longitude: lng, timestamp: new Date(), id: 0 },
              user, caregiver.phone || "", dependent as any, "SOS", 
              `🆘 แจ้งเตือน: ${dependent.firstName} กดปุ่มขอความช่วยเหลือ!`
            );
        }
    }
    // ==========================================
    // 🌍 CASE 2: ZONE LOGIC (แก้ไขใหม่ หายรัว 100%)
    // ==========================================
    else {
      let currentStatus = 0; 
      if (safeZoneData) {
        const nearR2 = Math.floor(r2 * 0.8);
        if (distInt <= r1) currentStatus = 0;      
        else if (distInt < nearR2) currentStatus = 1; 
        else if (distInt < r2) currentStatus = 3;     
        else currentStatus = 2; // DANGER
      }

      const buffer = 20;

      // 🟢 SAFE (0)
      if (currentStatus === 0) {
        currentDBStatus = "SAFE";
        // ต้องเข้ามาลึกกว่าขอบ Buffer ถึงจะถือว่ากลับบ้าน
        if (distInt <= (r1 - buffer)) {
            // ถ้าเคยแจ้งเตือนโซนไหนสักโซนมาก่อน ให้บอกว่ากลับมาแล้ว
            if (isAlertZone1Sent || isAlertNearZone2Sent || isAlertZone2Sent) {
                shouldSendLine = true; alertType = "BACK_SAFE";
                // ✅ RESET ALL FLAGS (จบข่าว)
                isAlertZone1Sent = false; 
                isAlertNearZone2Sent = false; 
                isAlertZone2Sent = false;
            }
        }
      } 
      // 🟡 ZONE 1 (1)
      else if (currentStatus === 1) {
        currentDBStatus = "WARNING";
        
        // ขาออก: ยังไม่เคยแจ้ง -> แจ้ง
        if (!isAlertZone1Sent) { 
            shouldSendLine = true; alertType = "ZONE_1"; 
            isAlertZone1Sent = true; 
        }
        // ขาเข้า: กลับมาจาก Zone 2 หรือ Near Zone 2
        else if (isAlertZone2Sent || isAlertNearZone2Sent) {
            // ต้องเข้ามาลึกกว่าขอบ NearR2
            if (distInt <= (Math.floor(r2 * 0.8) - buffer)) {
                shouldSendLine = true; alertType = "BACK_TO_ZONE_1";
                
                // ✅ FIX SPAM: ลดระดับ Flag ลงทันที
                isAlertZone2Sent = false;     // ปิด Flag โซนแดง
                isAlertNearZone2Sent = false; // ปิด Flag โซนส้มเข้ม
                // (แต่ isAlertZone1Sent ยังคง true ไว้นะ เพราะยังอยู่ในโซน 1)
            }
        }
      } 
      // 🟠 NEAR ZONE 2 (3) - 80%
      else if (currentStatus === 3) {
          currentDBStatus = "DANGER";

          // ขาออก: ยังไม่เคยแจ้ง -> แจ้ง
          if (!isAlertNearZone2Sent) {
              shouldSendLine = true; alertType = "NEAR_ZONE_2";
              isAlertNearZone2Sent = true; 
              isAlertZone1Sent = true; // ถือว่าผ่านโซน 1 มาแล้ว
          }
          // ขาเข้า: กลับมาจาก Zone 2 (แก้ให้แจ้งเตือนแล้ว!)
          else if (isAlertZone2Sent) {
             // ต้องเข้ามาลึกกว่าขอบ R2
             if (distInt <= (r2 - buffer)) {
                 shouldSendLine = true; alertType = "BACK_TO_NEAR_ZONE_2";
                 
                 // ✅ FIX SPAM: ลดระดับ Flag ลง
                 isAlertZone2Sent = false; // ปิด Flag โซนแดง (เพื่อให้รู้ว่าหลุดโซนแดงแล้ว)
             }
          }
      }
      // 🔴 ZONE 2 DANGER (2)
      else if (currentStatus === 2) {
        currentDBStatus = "DANGER";
        
        // ขาออก: แจ้งเตือน (ตัดเงื่อนไข alreadyInDanger ออกเพื่อให้แจ้งชัวร์ๆ)
        if (!isAlertZone2Sent) { 
          shouldSendLine = true; 
          alertType = "ZONE_2_DANGER"; 
          
          // ล็อคทุก Flag
          isAlertZone2Sent = true; 
          isAlertNearZone2Sent = true; 
          isAlertZone1Sent = true;
        }
      }
    }

    // ==========================================
    // 📨 SEND LINE MESSAGES
    // ==========================================
    if (shouldSendLine && caregiver?.user.lineId && !isManualSOS) {
       const lineId = caregiver.user.lineId;
       const distText = `${distInt} ม.`;
       
       if (alertType === "BACK_SAFE") {
           const msg = createGeneralAlertBubble("กลับเข้าสู่พื้นที่ปลอดภัย", "ผู้ป่วยกลับเข้ามาในเขตบ้านเรียบร้อยแล้ว", "ปลอดภัย", "#10B981", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "กลับเข้าพื้นที่", contents: msg });
       } 
       else if (alertType === "ZONE_2_DANGER") {
           // 🚨 CRITICAL ALERT (สีแดง + ปุ่ม)
           await sendCriticalAlertFlexMessage(
              lineId,
              { latitude: lat, longitude: lng, timestamp: new Date(), id: 0 },
              user,
              caregiver.phone || "",
              dependent as any,
              "ZONE", 
              `⚠️ แจ้งเตือน: ${dependent.firstName} ออกนอกเขตปลอดภัย! (ระยะ ${distText})`
           );
       }
       else if (alertType === "ZONE_1") {
           const msg = createGeneralAlertBubble("ออกนอกพื้นที่ชั้นใน", `ระยะ ${distText}`, distText, "#F59E0B", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "เตือนโซน 1", contents: msg });
       } 
       else if (alertType === "BACK_TO_ZONE_1") {
           const msg = createGeneralAlertBubble("กลับเข้าสู่เขตชั้น 1", `ระยะ ${distText}`, distText, "#FBBF24", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "กลับเข้าโซน 1", contents: msg });
       } 
       else if (alertType === "NEAR_ZONE_2") {
           const msg = createGeneralAlertBubble("ใกล้หลุดเขตปลอดภัย", `ระยะ ${distText}`, distText, "#F97316", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "เตือนระยะ 80%", contents: msg });
       }
       else if (alertType === "BACK_TO_NEAR_ZONE_2") {
           // ✅ เพิ่มข้อความขากลับ 80% ให้แล้วครับ
           const msg = createGeneralAlertBubble("กลับเข้าสู่ระยะเฝ้าระวัง (80%)", `ระยะ ${distText}`, distText, "#FB923C", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "กลับเข้าสู่ระยะ 80%", contents: msg });
       }
    }

    // อัปเดต Flag
    await prisma.dependentProfile.update({
      where: { id: dependent.id },
      data: { isAlertZone1Sent, isAlertNearZone2Sent, isAlertZone2Sent },
    });

    // บันทึกพิกัด
    const lastLocation = dependent.locations[0];
    let shouldSave = false;
    if (!lastLocation) shouldSave = true;
    else {
        const statusChanged = lastLocation.status !== currentDBStatus;
        const minutesPassed = (new Date().getTime() - new Date(lastLocation.timestamp).getTime()) / 60000;
        if (statusChanged || minutesPassed >= 5 || isManualSOS) shouldSave = true; 
    }

    if (shouldSave) {
      await prisma.location.create({
        data: {
          dependentId: dependent.id,
          latitude: lat, longitude: lng, battery: parseInt(battery || 0),
          distance: distInt, status: currentDBStatus, timestamp: new Date(),
        },
      });
    }

    // Sync Response
    const activeAlert = await prisma.extendedHelp.findFirst({
      where: { dependentId: dependent.id, status: "DETECTED" },
    });
    let stop_em = !activeAlert;
    if (waitViewLocation) {
      stop_em = false;
      if (body.location_status) {
        await pushStatusMessage(caregiver?.user.lineId!, dependent.id);
        stop_em = true;
        await prisma.dependentProfile.update({ where: { id: dependent.id }, data: { waitViewLocation: false } });
      }
    }

    return NextResponse.json({
      success: true,
      command_tracking: dependent.isGpsEnabled,
      request_location: !!activeAlert,
      stop_emergency: stop_em,
      sync_settings: {
        r1: safeZoneData?.radiusLv1 || 100,
        r2: safeZoneData?.radiusLv2 || 500,
        lat: safeZoneData?.latitude || 0.0,
        lng: safeZoneData?.longitude || 0.0,
      },
    });

  } catch (error) {
    console.error("💥 Server Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) { return handleRequest(req); }
export async function PUT(req: Request) { return handleRequest(req); }