import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { checkHeartRateAlert } from '@/services/alert.service';

async function handleRequest(request: Request) {
  try {
    const body = await request.json();
    const targetId = body.uId || body.lineId;
    const bpm = body.bpm;
    const status = body.status;

    if (!targetId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: parseInt(targetId) },
      include: { dependentProfile: true }
    });

    if (!user || !user.dependentProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const dependent = user.dependentProfile;
    const healthStatus = parseInt(status) === 1 ? 'ABNORMAL' : 'NORMAL';

    const record = await prisma.heartRateRecord.create({
      data: {
        dependentId: dependent.id,
        bpm: parseInt(bpm),
        status: healthStatus,
        timestamp: new Date(),
      },
    });

    try { await checkHeartRateAlert(dependent.id, parseInt(bpm)); } catch (e) {}

    return NextResponse.json({ success: true, data: record });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(req: Request) { return handleRequest(req); }
export async function PUT(req: Request) { return handleRequest(req); }