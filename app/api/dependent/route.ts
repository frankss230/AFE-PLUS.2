import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { Prisma } from '@prisma/client'; // Import เพื่อใช้ Type ของ WhereInput

export async function GET(request: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์ (Authentication & Authorization)
    const session = await getSession();
    
    // เช็คว่ามี Session ไหม และต้องเป็น ADMIN หรือ CAREGIVER เท่านั้น (ปรับตามความเหมาะสม)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. รับค่า Query Parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('q') || ''; // รับคำค้นหา (เช่น ชื่อเล่น)
    
    const skip = (page - 1) * limit;

    // 3. สร้างเงื่อนไขการค้นหา (Where Clause)
    // เงื่อนไขพื้นฐาน: ต้องเป็น User ที่ Active
    const whereCondition: Prisma.DependentProfileWhereInput = {
        user: { isActive: true }
    };

    // ถ้ามีการส่งคำค้นหามา (?q=สมชาย) ให้เพิ่มเงื่อนไขค้นหาชื่อ/นามสกุล
    if (search) {
        whereCondition.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } } // แถมค้นหาเบอร์โทรให้ด้วย
        ];
    }

    // 4. ดึงข้อมูล DependentProfile และนับจำนวนทั้งหมด
    const [dependents, total] = await Promise.all([
      prisma.dependentProfile.findMany({
        where: whereCondition, // ใช้เงื่อนไขที่สร้างไว้
        select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            marital: true,
            birthday: true,
            // ข้อมูล User
            user: {
                select: {
                    username: true,
                    lineId: true,
                    isActive: true
                }
            },
            // ข้อมูล Caregiver
            caregiver: {
                select: {
                    firstName: true,
                    lastName: true,
                    phone: true
                }
            },
            // ตำแหน่งล่าสุด (เพื่อโชว์แบต/สถานะ ในตาราง)
            locations: {
                take: 1,
                orderBy: { timestamp: 'desc' },
                select: {
                    latitude: true,
                    longitude: true,
                    battery: true,
                    status: true,
                    timestamp: true
                }
            }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // เรียงจากใหม่ไปเก่า
      }),
      
      // นับจำนวนตามเงื่อนไข (รวม Search ด้วย เพื่อให้ Pagination ถูกต้อง)
      prisma.dependentProfile.count({
        where: whereCondition
      }),
    ]);

    // 5. ส่งข้อมูลกลับ
    return NextResponse.json({
      dependents, 
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch dependents' },
      { status: 500 }
    );
  }
}