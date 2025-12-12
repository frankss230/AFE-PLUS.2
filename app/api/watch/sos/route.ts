import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendCriticalAlertFlexMessage } from '@/lib/line/flex-messages';

export const dynamic = 'force-dynamic';

async function handleSOS(request: Request) {
  try {
    const body = await request.json();
    const targetId = body.uid || body.lineId || body.users_id;
    const { latitude, longitude } = body;

    console.log(`🚨 [SOS DEBUG] Received ID: ${targetId}`);

    if (!targetId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { 
        dependentProfile: {
            include: {
                caregiver: { include: { user: true } },
                // ✅ เพิ่ม: ดึง Location ล่าสุดมาด้วย
                locations: {
                    take: 1,
                    orderBy: { timestamp: 'desc' }
                }
            }
        }
      }
    });

    if (!user || !user.dependentProfile) {
        return NextResponse.json({ success: false, message: `User not found` }, { status: 404 });
    }

    const dependent = user.dependentProfile;
    const caregiverProfile = dependent.caregiver;

    if (!caregiverProfile) {
         return NextResponse.json({ success: false, message: 'Caregiver not linked' }, { status: 400 });
    }

    // บันทึก SOS
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

    // ส่ง LINE Alert
    if (caregiverProfile.user.lineId) {
        const recipientId = caregiverProfile.user.lineId;
        const caregiverPhone = caregiverProfile.phone || '0000000000';

        console.log(`✅ Sending SOS Alert to: ${recipientId}`);

        await sendCriticalAlertFlexMessage(
            recipientId,
            helpRequest, 
            user,
            caregiverPhone,
            dependent as any,
            'SOS' // ✅ ระบุ Type ว่าเป็น SOS (จะ *ไม่มี* ปุ่ม 1669)
        );
    }

    return NextResponse.json({ success: true, data: helpRequest });

  } catch (error) {
    console.error("SOS Error:", error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) { return handleSOS(request); }
export async function PUT(request: Request) { return handleSOS(request); }