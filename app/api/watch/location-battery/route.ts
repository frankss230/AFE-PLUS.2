import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { checkSafezoneAlert } from '@/services/alert.service';

// ฟังก์ชันหลัก (Logic เดิม)
async function handleRequest(request: Request) {
  try {
    const body = await request.json();
    // รองรับทั้ง uId (ใหม่) และ lineId (เก่า)
    const targetId = body.uId || body.lineId; 
    const { latitude, longitude, battery, distance, status } = body;

    if (!targetId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // 1. ค้นหา User (Dependent)
    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { dependentProfile: true }
    });

    if (!user || !user.dependentProfile) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    const dependent = user.dependentProfile;

    // 2. แปลงสถานะ
    let zoneStatus: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
    const statusInt = parseInt(status);
    if (statusInt === 1) zoneStatus = 'WARNING';
    if (statusInt === 2) zoneStatus = 'DANGER';

    // 3. บันทึก
    await prisma.location.create({
      data: {
        dependentId: dependent.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        battery: parseInt(battery),
        distance: parseInt(distance || 0),
        status: zoneStatus,
        timestamp: new Date(),
      },
    });

    // 4. เช็ค Alert
    try { await checkSafezoneAlert(dependent.id, parseInt(distance || 0)); } catch (e) {}

    // 5. ส่งคำสั่งกลับ
    // (Logic เดิม: ถ้ามี Alert ค้าง ให้ขอ location เพิ่ม)
    const activeAlert = await prisma.extendedHelp.findFirst({
        where: { dependentId: dependent.id, status: 'DETECTED' }
    });

    return NextResponse.json({ 
        success: true, 
        command_tracking: dependent.isGpsEnabled, 
        request_location: !!activeAlert,
        stop_emergency: !activeAlert,
        request_extended_help_location: !!activeAlert
    });

  } catch (error) {
    console.error("Location Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// ✅ Export ทั้ง POST และ PUT
export async function POST(req: Request) { return handleRequest(req); }
export async function PUT(req: Request) { return handleRequest(req); }