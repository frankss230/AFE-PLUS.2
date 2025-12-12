import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "No ID" }, { status: 400 });

    const alert = await prisma.extendedHelp.findUnique({
        where: { id: parseInt(id) },
        select: { status: true, rescuerName: true, rescuerPhone: true, resolvedAt: true } // ดึงแค่นี้พอ ประหยัด
    });

    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(alert);
}