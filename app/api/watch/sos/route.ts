import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendCriticalAlertFlexMessage } from '@/lib/line/flex-messages';

export const dynamic = 'force-dynamic';

// ฟังก์ชันหลักสำหรับจัดการ SOS
async function handleSOS(request: Request) {
  try {
    const body = await request.json();
    
    // 1. ดึง ID (รองรับหลายชื่อตัวแปร)
    const targetId = body.uid || body.lineId || body.users_id;
    const { latitude, longitude } = body;

    console.log(`🚨 [SOS DEBUG] Received ID: ${targetId}`);

    if (!targetId) {
         return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    // 2. ค้นหา User -> DependentProfile -> Caregiver
    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { 
        dependentProfile: {
            include: {
                caregiver: { 
                    include: { user: true } 
                }
            }
        }
      }
    });

    // เช็คว่าเจอ User ไหม
    if (!user) {
        console.log(`❌ [SOS DEBUG] User ID ${targetId} not found in DB`);
        return NextResponse.json({ success: false, message: `User ${targetId} not found` }, { status: 404 });
    }

    // เช็คว่ามี Profile ไหม
    if (!user.dependentProfile) {
        console.log(`❌ [SOS DEBUG] User ${targetId} has no DependentProfile`);
        return NextResponse.json({ success: false, message: 'Dependent Profile missing' }, { status: 400 });
    }

    // ✅ ประกาศตัวแปร dependent แค่ครั้งเดียวตรงนี้
    const dependent = user.dependentProfile;
    const caregiverProfile = dependent.caregiver;

    // เช็คผู้ดูแล
    if (!caregiverProfile) {
         console.log(`❌ [SOS DEBUG] Dependent ${dependent.id} has no Caregiver linked`);
         return NextResponse.json({ success: false, message: 'Caregiver not linked' }, { status: 400 });
    }

    // 3. บันทึก SOS ลงตาราง ExtendedHelp
    const helpRequest = await prisma.extendedHelp.create({
      data: {
        dependentId: dependent.id,
        reporterId: caregiverProfile.id,
        latitude: parseFloat(latitude || 0),
        longitude: parseFloat(longitude || 0),
        type: 'WATCH_SOS', 
        status: 'DETECTED',
        requestedAt: new Date(),
      },
    });

    // 4. ส่ง LINE Alert
    if (caregiverProfile.user.lineId) {
        const recipientId = caregiverProfile.user.lineId;
        const caregiverPhone = caregiverProfile.phone || '0000000000';

        console.log(`✅ Sending SOS Alert to: ${recipientId}`);

        await sendCriticalAlertFlexMessage(
            recipientId,
            helpRequest, 
            user,
            caregiverPhone,
            // ส่ง dependent ไปเป็น parameter ตัวสุดท้าย (เพื่อให้แสดงชื่อผู้สูงอายุ)
            // cast as any เพื่อแก้ปัญหา Type Mismatch ชั่วคราว (เพราะ Model คนละชื่อแต่โครงสร้างเหมือนกัน)
            dependent as any 
        );
    }

    return NextResponse.json({ success: true, data: helpRequest });

  } catch (error) {
    console.error("SOS Error:", error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// ✅ รองรับทั้ง POST และ PUT
export async function POST(request: Request) { return handleSOS(request); }
export async function PUT(request: Request) { return handleSOS(request); }