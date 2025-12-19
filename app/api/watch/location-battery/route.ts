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

async function handleRequest(request: Request) {
  try {
    const body = await request.json();

    // 1. รับค่าจากนาฬิกา
    const targetId = body.uId || body.lineId || body.users_id;
    const { battery, distance, status } = body;

    let rawLat = body.latitude ?? body.lat ?? 0;
    let rawLng = body.longitude ?? body.lng ?? 0;
    const lat = parseFloat(String(rawLat));
    const lng = parseFloat(String(rawLng));

    // ป้องกันพิกัด 0,0 หรือ Invalid
    if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) {
      return NextResponse.json({ success: true, message: "Ignored 0,0" });
    }

    if (!targetId)
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // 2. ดึงข้อมูล User และ Profile
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
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    const dependent = user.dependentProfile;
    const caregiver = dependent.caregiver;
    const safeZoneData = dependent.safeZones[0];
    const waitViewLocation = dependent.waitViewLocation ?? false;

    // เตรียมตัวแปร Flag สถานะการแจ้งเตือน
    let { isAlertZone1Sent, isAlertNearZone2Sent, isAlertZone2Sent } = dependent;

    const statusInt = parseInt(status);
    const distInt = parseInt(distance || 0);

    // กันค่า Glitch (ส่งมาเป็น 0 ทั้งคู่)
    if (statusInt === 0 && distInt === 0) {
      return NextResponse.json({ success: true, message: "Glitch Skipped" });
    }

    let currentDBStatus: "SAFE" | "WARNING" | "DANGER" = "SAFE";
    let shouldSendLine = false;
    let alertType = "NONE";

    // ============================================================
    // 🚨 PART 1: ตรวจจับการกดปุ่ม SOS (Manual SOS)
    // ============================================================
    const isManualSOS = statusInt === 2; // กดปุ่ม SOS ที่นาฬิกา

    if (isManualSOS) {
        console.log("🚨 Manual SOS Detected from Watch!");
        currentDBStatus = "DANGER";

        // ตรวจสอบว่าเพิ่งกดไปเมื่อกี้หรือเปล่า (กันรัว 1 นาที)
        const recentSOS = await prisma.extendedHelp.findFirst({
            where: { dependentId: dependent.id, type: "WATCH_SOS", requestedAt: { gte: new Date(Date.now() - 60000) } }
        });

        if (!recentSOS && caregiver?.user.lineId) {
             // 1. ส่ง Flex Message แบบ "ขอความช่วยเหลือ" (สีแดงเข้ม มีปุ่ม)
             await sendCriticalAlertFlexMessage(
              caregiver.user.lineId,
              { latitude: lat, longitude: lng, timestamp: new Date(), id: 0 },
              user,
              caregiver.phone || "",
              dependent as any,
              "SOS", 
              `แจ้งเตือน: ${dependent.firstName} กดปุ่มขอความช่วยเหลือ!`
            );
        }
    }
    
    // ============================================================
    // 🌍 PART 2: ตรวจจับโซน (Zone Logic) - แยกจาก SOS ชัดเจน
    // ============================================================
    else {
      let currentStatus = 0; // 0=Safe, 1=Zone1, 2=Zone2, 3=NearZone2

      if (safeZoneData) {
        const r1 = safeZoneData.radiusLv1; // เช่น 100 เมตร
        const r2 = safeZoneData.radiusLv2; // เช่น 500 เมตร
        const nearR2 = Math.floor(r2 * 0.8); // 80% ของโซน 2 (เช่น 400 เมตร)

        // คำนวณสถานะปัจจุบันตามระยะทางจริง
        if (distInt <= r1) currentStatus = 0;       // อยู่ในบ้าน
        else if (distInt < nearR2) currentStatus = 1;  // โซน 1 (Warning)
        else if (distInt < r2) currentStatus = 3;      // ใกล้หลุดโซน 2 (Near Danger)
        else currentStatus = 2;                        // หลุดโซน 2 (Danger)

        // 🛡️ BUFFER LOGIC: กันสั่น (Hysteresis)
        // ต้องกลับเข้ามาลึกกว่าขอบ 20 เมตร ถึงจะถือว่ากลับเข้ามาจริง (กันเด้งไปมา)
        const buffer = 20; 

        // --- 1. กรณีกลับเข้า Safe Zone (0) ---
        if (currentStatus === 0) {
            currentDBStatus = "SAFE";
            
            // เช็คว่ากลับเข้ามาลึกพอหรือยัง (เช่น รัศมี 100 ต้องเข้ามาถึง 80)
            if (distInt <= (r1 - buffer)) {
                if (isAlertZone1Sent || isAlertNearZone2Sent || isAlertZone2Sent) {
                    shouldSendLine = true; 
                    alertType = "BACK_SAFE";
                    // ✅ รีเซ็ต Flag ได้ เพราะกลับมาบ้านจริงๆ แล้ว
                    isAlertZone1Sent = false; 
                    isAlertNearZone2Sent = false; 
                    isAlertZone2Sent = false;
                }
            } else {
                // อยู่ในช่วง Buffer (80-100 เมตร) -> ไม่ทำอะไร รักษาถานะเดิมไว้
                console.log("🛡️ In Buffer Zone (Safe edge) - No Status Change");
            }
        } 
        
        // --- 2. กรณีอยู่ Zone 1 (Warning) ---
        else if (currentStatus === 1) {
            currentDBStatus = "WARNING";
            // ขาออก: แจ้งเตือนครั้งแรก
            if (!isAlertZone1Sent) { 
                shouldSendLine = true; alertType = "ZONE_1"; isAlertZone1Sent = true; 
            }
            // ขาเข้า: กลับมาจากโซนอันตรายกว่า
            else if (isAlertZone2Sent || isAlertNearZone2Sent) {
                // ต้องกลับเข้ามาลึกกว่าขอบ NearZone2 สักหน่อย
                if (distInt <= (nearR2 - buffer)) {
                    shouldSendLine = true; alertType = "BACK_TO_ZONE_1";
                    isAlertNearZone2Sent = false;
                    // ❌ ห้ามรีเซ็ต isAlertZone2Sent ที่นี่ (รอไปรีเซ็ตตอนถึงบ้านทีเดียว เพื่อความชัวร์)
                }
            }
        } 
        
        // --- 3. กรณีอยู่ Near Zone 2 (80%) ---
        else if (currentStatus === 3) {
            currentDBStatus = "DANGER";
            if (!isAlertNearZone2Sent) {
                shouldSendLine = true; alertType = "NEAR_ZONE_2";
                isAlertNearZone2Sent = true; isAlertZone1Sent = true;
            } else if (isAlertZone2Sent) { 
                // กลับมาจากโซนแดง (Zone 2)
                 if (distInt <= (r2 - buffer)) {
                    shouldSendLine = true; alertType = "BACK_TO_NEAR_ZONE_2";
                 }
            }
        } 
        
        // --- 4. กรณีหลุด Zone 2 (Danger - ออกนอกพื้นที่) ---
        else if (currentStatus === 2) {
            currentDBStatus = "DANGER";
            if (!isAlertZone2Sent) { 
                // แจ้งเตือนครั้งเดียวจบ แล้วล็อคยาวจนกว่าจะกลับบ้าน
                shouldSendLine = true; 
                alertType = "ZONE_2_DANGER"; 
                isAlertZone2Sent = true; 
                isAlertNearZone2Sent = true; 
                isAlertZone1Sent = true;
            }
        }
      }
    }

    // ============================================================
    // 📨 PART 3: ส่ง LINE Notification (แยกประเภทชัดเจน)
    // ============================================================
    if (shouldSendLine && caregiver?.user.lineId && !isManualSOS) {
       const lineId = caregiver.user.lineId;
       const distText = `${distInt} ม.`;
       
       if (alertType === "BACK_SAFE") {
           const msg = createGeneralAlertBubble("กลับเข้าสู่พื้นที่ปลอดภัย", "ผู้ป่วยกลับเข้ามาในเขตบ้านเรียบร้อยแล้ว", "ปลอดภัย", "#10B981", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "กลับเข้าพื้นที่", contents: msg });
       } else if (alertType === "ZONE_1") {
           const msg = createGeneralAlertBubble("ออกนอกพื้นที่ชั้นใน", `ระยะห่าง ${distText}`, "เฝ้าระวัง", "#F59E0B", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "เตือน: ออกนอกโซน 1", contents: msg });
       } else if (alertType === "BACK_TO_ZONE_1") {
           const msg = createGeneralAlertBubble("กลับเข้าสู่เขตชั้น 1", `ระยะห่าง ${distText}`, "เฝ้าระวัง", "#FBBF24", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "กลับเข้าโซน 1", contents: msg });
       } else if (alertType === "NEAR_ZONE_2") {
           const msg = createGeneralAlertBubble("ใกล้หลุดเขตปลอดภัย", `ระยะ ${distText} (80% ของขอบเขต)`, "เตือนภัย", "#F97316", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "เตือน: ใกล้หลุดโซนปลอดภัย", contents: msg });
       } else if (alertType === "BACK_TO_NEAR_ZONE_2") {
           const msg = createGeneralAlertBubble("กลับเข้าสู่ระยะเฝ้าระวัง", `ระยะ ${distText}`, "เตือนภัย", "#FB923C", false);
           await lineClient.pushMessage(lineId, { type: "flex", altText: "กลับเข้าสู่ระยะ 80%", contents: msg });
       }
       // 🔴 ZONE 2 DANGER (ออกนอกเขต) - ใช้ Flex Message ธรรมดา (ไม่ใช่ SOS)
       else if (alertType === "ZONE_2_DANGER") {
           const msg = createGeneralAlertBubble(
               "ออกนอกเขตปลอดภัย!",   
               `ผู้ป่วยออกนอกระยะที่กำหนด (${distText})`, 
               "อันตราย",              
               "#DC2626",             
               false                  
           );
           await lineClient.pushMessage(lineId, { 
               type: "flex", 
               altText: "แจ้งเตือน: ออกนอกเขตปลอดภัย", 
               contents: msg 
           });
       }
    }

    // อัปเดต Flag ลง Database (สำคัญมาก!)
    await prisma.dependentProfile.update({
      where: { id: dependent.id },
      data: { isAlertZone1Sent, isAlertNearZone2Sent, isAlertZone2Sent },
    });

    // ============================================================
    // 💾 PART 4: บันทึกพิกัด (Location History)
    // ============================================================
    const lastLocation = await prisma.location.findFirst({
      where: { dependentId: dependent.id }, orderBy: { timestamp: "desc" },
    });
    
    let shouldSave = false;
    // บันทึกเมื่อ: 1. ไม่มีข้อมูลเก่า 2. สถานะเปลี่ยน 3. เวลาผ่านไป 5 นาที 4. กด SOS
    if (!lastLocation) shouldSave = true;
    else {
        const statusChanged = lastLocation.status !== currentDBStatus;
        const timeDiff = new Date().getTime() - new Date(lastLocation.timestamp).getTime();
        const minutesPassed = timeDiff / (1000 * 60);
        if (statusChanged || minutesPassed >= 5 || isManualSOS) shouldSave = true; 
    }

    if (shouldSave) {
      await prisma.location.create({
        data: {
          dependentId: dependent.id,
          latitude: lat,
          longitude: lng,
          battery: parseInt(battery || 0),
          distance: distInt,
          status: currentDBStatus,
          timestamp: new Date(),
        },
      });
    }

    // ============================================================
    // 🔄 PART 5: Sync & Response (ส่งค่ากลับนาฬิกา)
    // ============================================================
    const activeAlert = await prisma.extendedHelp.findFirst({
      where: { dependentId: dependent.id, status: "DETECTED" },
    });

    let stop_em = !activeAlert;
    if (waitViewLocation) {
      stop_em = false;
      if (body.location_status) { // นาฬิกาบอกว่า "ล็อกพิกัดได้แล้ว"
        await pushStatusMessage(caregiver?.user.lineId!, dependent.id);
        stop_em = true;
        await prisma.dependentProfile.update({ where: { id: dependent.id }, data: { waitViewLocation: false } });
      }
    }

    return NextResponse.json({
      success: true,
      command_tracking: dependent.isGpsEnabled,
      request_location: !!activeAlert, // ถ้ามี SOS ค้างอยู่ ให้เปิด GPS ถาวร
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