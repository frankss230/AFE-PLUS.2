import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic'; // ✅ ใส่ไว้กัน Caching เพี้ยน

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
            // ✅ ต้องเพิ่ม 2 ตัวนี้ครับ! ไม่งั้น Map ไม่ขึ้น
            latitude: true,
            longitude: true,
            // ✅ แถมชื่อคนเจ็บไปให้ด้วย เผื่อเอาไปโชว์หัวข้อ
            dependent: {
                select: { firstName: true, lastName: true }
            }
        } 
    });

    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ✅ ส่งกลับไปพร้อมแปลงชื่อตัวแปรให้ตรงกับที่หน้าเว็บรอรับ (lat, lng)
    return NextResponse.json({
        ...alert,
        lat: alert.latitude, 
        lng: alert.longitude,
        victimName: alert.dependent ? `${alert.dependent.firstName} ${alert.dependent.lastName}` : "ไม่ระบุ"
    });
}