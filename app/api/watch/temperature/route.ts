import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { checkTemperatureAlert } from '@/services/alert.service';

async function handleRequest(request: Request) {
  try {
    const body = await request.json();
    const targetId = body.uId || body.lineId;
    // รองรับทั้ง value และ temperature_value
    const val = body.value || body.temperature_value;
    const status = body.status;

    if (!targetId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { dependentProfile: true }
    });

    if (!user || !user.dependentProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const dependent = user.dependentProfile;
    const healthStatus = parseInt(status) === 1 ? 'ABNORMAL' : 'NORMAL';

    const record = await prisma.temperatureRecord.create({
      data: {
        dependentId: dependent.id,
        value: parseFloat(val),
        status: healthStatus,
        timestamp: new Date(),
      },
    });

    try { await checkTemperatureAlert(dependent.id, parseFloat(val)); } catch (e) {}

    return NextResponse.json({ success: true, data: record });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(req: Request) { return handleRequest(req); }
export async function PUT(req: Request) { return handleRequest(req); }