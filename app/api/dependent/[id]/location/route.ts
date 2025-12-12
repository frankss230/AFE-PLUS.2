import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma'; // เรียก DB ตรงๆ
import { getSession } from '@/lib/auth/session'; // อย่าลืมกันประตู

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. ตรวจสอบสิทธิ์ (ใครเข้าถึงหน้านี้ได้บ้าง?)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. แปลง ID เป็นตัวเลข (นี่คือ Dependent ID นะครับ ไม่ใช่ Caregiver ID)
    const dependentId = parseInt(params.id);

    // 3. ดึง Location ล่าสุด 1 อัน
    const location = await prisma.location.findFirst({
      where: {
        dependentId: dependentId
      },
      orderBy: {
        timestamp: 'desc' // เรียงจากเวลาล่าสุด
      }
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // 4. ส่งค่ากลับ (ผมแปลง key ให้ใช้ง่ายๆ กับ Google Maps ฝั่งหน้าบ้านด้วย)
    return NextResponse.json({ 
        location: {
            lat: location.latitude,   // หน้าบ้านชอบใช้ lat
            lng: location.longitude,  // หน้าบ้านชอบใช้ lng
            battery: location.battery,
            status: location.status,
            updatedAt: location.timestamp
        } 
    });

  } catch (error) {
    console.error("Location API Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}