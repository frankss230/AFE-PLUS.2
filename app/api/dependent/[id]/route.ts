import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma'; // เรียก DB โดยตรง ชัวร์กว่า
import { getSession } from '@/lib/auth/session';

// ======================= GET: ดึงข้อมูลผู้ป่วยรายคน =======================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    // เช็คสิทธิ์: ต้องเป็น ADMIN หรือ Caregiver คนนั้นๆ (ในที่นี้ให้ ADMIN ดูก่อน)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dependentId = parseInt(params.id);

    // ดึงข้อมูล Dependent พร้อมข้อมูล User แม่ และ Caregiver ที่ดูแล
    const dependent = await prisma.dependentProfile.findUnique({
      where: { id: dependentId },
      include: {
        user: {
            select: { username: true, lineId: true, isActive: true }
        },
        caregiver: {
            select: { firstName: true, lastName: true, phone: true }
        }
      }
    });

    if (!dependent) {
      return NextResponse.json({ error: 'Dependent not found' }, { status: 404 });
    }

    return NextResponse.json({ dependent });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch dependent' }, { status: 500 });
  }
}

// ======================= PUT: แก้ไขข้อมูลผู้ป่วย =======================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    // ⚠️ ตรงนี้แนะนำให้ใช้ Enum Role แทนเลข 1 จะอ่านง่ายกว่าครับ
    // เช่น if (session.user.role !== 'ADMIN') 
    if (!session || session.statusId !== 1) { 
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dependentId = parseInt(params.id);
    const body = await request.json();

    // อัปเดตข้อมูล (แยก User กับ Profile)
    // สมมติว่า body ส่งมาแค่ field ใน profile เช่น firstName, lastName, phone
    const updatedDependent = await prisma.dependentProfile.update({
        where: { id: dependentId },
        data: {
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            gender: body.gender,
            birthday: body.birthday ? new Date(body.birthday) : undefined,
            // ถ้ามีการเปลี่ยนผู้ดูแล
            caregiverId: body.caregiverId ? parseInt(body.caregiverId) : undefined,
            // ถ้าอยากแก้ User (เช่น password/active) ต้องเขียนแยกอีกนิดครับ
        }
    });

    return NextResponse.json({ success: true, dependent: updatedDependent });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: 'Failed to update dependent' }, { status: 500 });
  }
}

// ======================= DELETE: ลบผู้ป่วย =======================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.statusId !== 1) { // ADMIN เท่านั้น
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dependentId = parseInt(params.id);

    // 1. หา userId ก่อน เพราะเราควรลบที่ตาราง User (Core) แล้วให้ Cascade ลบ Profile
    // หรือจะแค่ set isActive = false (Soft Delete) ก็ได้
    const dependent = await prisma.dependentProfile.findUnique({
        where: { id: dependentId },
        select: { userId: true }
    });

    if (!dependent) {
        return NextResponse.json({ error: 'Dependent not found' }, { status: 404 });
    }

    // Option A: ลบถาวร (Hard Delete)
    await prisma.user.delete({
        where: { id: dependent.userId }
    });

    // Option B: แค่ปิดการใช้งาน (Soft Delete) - แนะนำอันนี้ปลอดภัยกว่า
    /*
    await prisma.user.update({
        where: { id: dependent.userId },
        data: { isActive: false }
    });
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: 'Failed to delete dependent' }, { status: 500 });
  }
}