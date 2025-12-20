import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "No ID" }, { status: 400 });

    const alert = await prisma.extendedHelp.findUnique({
        where: { id: parseInt(id) },
        select: { 
            status: true, 
            rescuerName: true, 
            rescuerPhone: true, 
            resolvedAt: true,
            latitude: true,
            longitude: true,
            dependent: {
                select: { firstName: true, lastName: true }
            }
        } 
    });

    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
        ...alert,
        lat: alert.latitude, 
        lng: alert.longitude,
        victimName: alert.dependent ? `${alert.dependent.firstName} ${alert.dependent.lastName}` : "ไม่ระบุ"
    });
}