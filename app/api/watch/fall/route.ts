import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendCriticalAlertFlexMessage } from '@/lib/line/flex-messages';

async function handleFall(request: Request) {
  try {
    const body = await request.json();
    
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
            include: { 
                caregiver: { include: { user: true } },
                // ✅ เพิ่ม: ดึง Location ล่าสุดมาด้วย (เผื่อ GPS ใน body เป็น null)
                locations: {
                    take: 1,
                    orderBy: { timestamp: 'desc' }
                }
            }
        }
      }
    });

    if (!user || !user.dependentProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const dependent = user.dependentProfile;
    const caregiver = dependent.caregiver;

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

    if (String(fallStat) === '0') {
        // เปิด GPS
        await prisma.dependentProfile.update({
            where: { id: dependent.id },
            data: { isGpsEnabled: true }
        });

        // ส่ง LINE
        if (caregiver?.user.lineId) {
             await sendCriticalAlertFlexMessage(
                caregiver.user.lineId,
                fallRecord,
                user,
                caregiver.phone || '',
                dependent as any,
                'FALL' // ✅ ระบุ Type ว่าเป็น FALL (จะมีปุ่ม 1669)
            );
        }
    }

    return NextResponse.json({ success: true });
  } catch (e) { 
      console.error(e);
      return NextResponse.json({ error: 'Error' }, { status: 500 }); 
  }
}

export async function POST(req: Request) { return handleFall(req); }
export async function PUT(req: Request) { return handleFall(req); }