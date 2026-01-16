import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendCriticalAlertFlexMessage } from '@/lib/line/flex-messages';

export const dynamic = 'force-dynamic';

async function handleSOS(request: Request) {
  try {
    const body = await request.json();
    const targetId = body.uid || body.lineId || body.users_id;
    const { latitude, longitude } = body;

    console.log(` [SOS DEBUG] Received ID: ${targetId}`);

    if (!targetId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { 
        dependentProfile: {
            include: {
                caregiver: { include: { user: true } },
                locations: { take: 1, orderBy: { timestamp: 'desc' } }
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

    const temporaryHelpData = {
        id: 0, 
        latitude: parseFloat(latitude || 0),
        longitude: parseFloat(longitude || 0),
        timestamp: new Date()
    };

    
    if (caregiverProfile.user.lineId) {
        const recipientId = caregiverProfile.user.lineId;
        const caregiverPhone = caregiverProfile.phone || '0000000000';

        console.log(` Sending SOS Alert (Private) to: ${recipientId}`);

        await sendCriticalAlertFlexMessage(
            recipientId,
            temporaryHelpData as any, 
            user,
            caregiverPhone,
            dependent as any,
            'SOS',
            `มีการกดเรียกผู้ดูแล`
        );
    }

    return NextResponse.json({ success: true, message: 'Alert sent to caregiver' });

  } catch (error) {
    console.error("SOS Error:", error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) { return handleSOS(request); }
export async function PUT(request: Request) { return handleSOS(request); }