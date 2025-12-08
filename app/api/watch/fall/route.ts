import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendCriticalAlertFlexMessage } from '@/lib/line/flex-messages';
import { getCaregiverRecipientId } from '@/lib/utils/line-recipient';

async function handleFall(request: Request) {
  try {
    const body = await request.json();
    
    // รองรับ key ของเพื่อน (users_id, fall_status, x_axis...)
    const targetId = body.users_id || body.lineId;
    const fallStat = body.fall_status || body.status;
    const x = body.x_axis || body.xAxis || 0;
    const y = body.y_axis || body.yAxis || 0;
    const z = body.z_axis || body.zAxis || 0;
    const { latitude, longitude } = body;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { 
        dependentProfile: {
            include: { caregiver: { include: { user: true } } }
        }
      }
    });

    if (!user || !user.dependentProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const dependent = user.dependentProfile;
    const caregiver = dependent.caregiver;

    // บันทึก
    const fallRecord = await prisma.fallRecord.create({
      data: {
        dependentId: dependent.id,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        xAxis: parseFloat(x),
        yAxis: parseFloat(y),
        zAxis: parseFloat(z),
        status: (String(fallStat) === '0') ? 'DETECTED' : 'RESOLVED',
        timestamp: new Date(),
      },
    });

    // ถ้าล้มจริง (status 0)
    if (String(fallStat) === '0') {
        // 1. บังคับเปิด GPS
        await prisma.dependentProfile.update({
            where: { id: dependent.id },
            data: { isGpsEnabled: true }
        });

        // 2. ส่ง LINE
        if (caregiver?.user.lineId) {
             await sendCriticalAlertFlexMessage(
                caregiver.user.lineId,
                fallRecord,
                user,
                caregiver.phone || '',
                dependent as any
            );
        }
    }

    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(req: Request) { return handleFall(req); }
export async function PUT(req: Request) { return handleFall(req); }